import json
from pathlib import Path
from graphify import extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json

root = Path('.').resolve()
Path('graphify-out').mkdir(exist_ok=True)

detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))
all_nodes = []
all_edges = []

for path_str in detect.get('files', {}).get('document', []):
    p = Path(path_str)
    if not p.exists():
        continue
    res = extract.extract_markdown(p)
    all_nodes.extend(res.get('nodes', []))
    all_edges.extend(res.get('edges', []))

for path_str in detect.get('files', {}).get('image', []) or []:
    p = Path(path_str)
    if not p.exists():
        continue
    file_nid = f"file:{str(p)}"
    img_nid = f"image:{p.name}"
    all_nodes.append({
        'id': file_nid,
        'label': p.name,
        'file_type': 'image',
        'source_file': str(p),
        'source_location': 'L1',
    })
    all_nodes.append({
        'id': img_nid,
        'label': p.name,
        'file_type': 'image',
        'source_file': str(p),
        'source_location': 'L1',
    })
    all_edges.append({
        'source': file_nid,
        'target': img_nid,
        'relation': 'contains',
        'confidence': 'EXTRACTED',
        'source_file': str(p),
        'source_location': 'L1',
        'weight': 1.0,
    })

ast = {'nodes': [], 'edges': [], 'input_tokens': 0, 'output_tokens': 0}
sem = {'nodes': all_nodes, 'edges': all_edges, 'hyperedges': [], 'input_tokens': 0, 'output_tokens': 0}
Path('graphify-out/.graphify_ast.json').write_text(json.dumps(ast, indent=2, ensure_ascii=False), encoding='utf-8')
Path('graphify-out/.graphify_semantic.json').write_text(json.dumps(sem, indent=2, ensure_ascii=False), encoding='utf-8')

seen = set()
merged_nodes = []
for n in ast['nodes'] + sem['nodes']:
    if n['id'] not in seen:
        seen.add(n['id'])
        merged_nodes.append(n)
merged_edges = ast['edges'] + sem['edges']
merged = {
    'nodes': merged_nodes,
    'edges': merged_edges,
    'hyperedges': [],
    'input_tokens': sem.get('input_tokens', 0),
    'output_tokens': sem.get('output_tokens', 0),
}
Path('graphify-out/.graphify_extract.json').write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding='utf-8')

G = build_from_json(merged)
communities = cluster(G)
cohesion = score_all(G, communities)
labels = {cid: f'Community {cid}' for cid in communities}
questions = suggest_questions(G, communities, labels)

graph_json_path = Path('graphify-out/graph.json')
Path('graphify-out/GRAPH_REPORT.md').write_text(
    generate(G, communities, cohesion, labels, god_nodes(G), surprising_connections(G, communities), detect, {'input': merged['input_tokens'], 'output': merged['output_tokens']}, '.', suggested_questions=questions),
    encoding='utf-8'
)
to_json(G, communities, graph_json_path)
Path('graphify-out/.graphify_analysis.json').write_text(json.dumps({
    'communities': {str(k): v for k, v in communities.items()},
    'cohesion': {str(k): v for k, v in cohesion.items()},
    'gods': god_nodes(G),
    'surprises': surprising_connections(G, communities),
    'questions': questions,
}, indent=2, ensure_ascii=False), encoding='utf-8')
print(f'Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities')
