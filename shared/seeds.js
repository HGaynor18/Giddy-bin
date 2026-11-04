// Built-in starting data for sites that existed before sites were kept in the database.
//
// When an admin first opens one of these, its details and plan are written to Firestore (sites/<id>, sitePlans/<id>)
// and from then on the Site editor is the place to change them. Until then everyone sees this copy.
// The data people add (notes, lists, materials, important items) was always in Firestore and is not touched.
window.GB_SEEDS = {
  "peninsula-view": {"name":"Peninsula View","detail":"Stage 2, 34 units. Unit notes, materials on site, morning checks.","kind":"units","status":"active","unitWord":"Lot","source":"Plan from drawing 150136/A1300 rev C2, ILU Type 03A drawing list. Lots 29 and 33 have no label on the drawing, so their numbers are placed by position.","plan":{"src":"sites/peninsula-view/plan.webp","w":1850,"h":1235,"pageMm":null},"hit":{"w":190,"h":88},"units":[{"id":"1","label":"1","x":80,"y":109,"hx":137,"hy":132,"storey":"single","type":"3B"},
    {"id":"2","label":"2","x":80,"y":219,"hx":137,"hy":242,"storey":"single","type":"3B"},
    {"id":"3","label":"3","x":80,"y":353,"hx":137,"hy":376,"storey":"single","type":"3B"},
    {"id":"4","label":"4","x":80,"y":462,"hx":137,"hy":485,"storey":"single","type":"3B"},
    {"id":"5","label":"5","x":76,"y":611,"hx":132,"hy":634,"storey":"single","type":"2"},
    {"id":"6","label":"6","x":76,"y":758,"hx":132,"hy":781,"storey":"single","type":"2"},
    {"id":"7","label":"7","x":80,"y":908,"hx":137,"hy":932,"storey":"single","type":"3B"},
    {"id":"8","label":"8","x":80,"y":1018,"hx":137,"hy":1041,"storey":"single","type":"3B"},
    {"id":"9","label":"9","x":377,"y":124,"hx":434,"hy":147,"storey":"double","type":"1B"},
    {"id":"10","label":"10","x":373,"y":229,"hx":434,"hy":252,"storey":"double","type":"1B"},
    {"id":"11","label":"11","x":379,"y":362,"hx":440,"hy":385,"storey":"double","type":"3A","extra":"stage 2A"},
    {"id":"12","label":"12","x":376,"y":459,"hx":437,"hy":482,"storey":"double","type":"3A","extra":"mirrored, stage 2A"},
    {"id":"13","label":"13","x":374,"y":628,"hx":435,"hy":650,"storey":"double","type":"3A","extra":"stage 2A"},
    {"id":"14","label":"14","x":371,"y":736,"hx":432,"hy":759,"storey":"double","type":"3A","extra":"mirrored, stage 2A"},
    {"id":"15","label":"15","x":368,"y":935,"hx":428,"hy":958,"storey":"double","type":"3A","extra":"stage 2A"},
    {"id":"16","label":"16","x":352,"y":1043,"hx":413,"hy":1066,"storey":"single","type":"3B"},
    {"id":"17","label":"17","x":687,"y":944,"hx":747,"hy":967,"storey":"single","type":"4"},
    {"id":"18","label":"18","x":687,"y":1035,"hx":748,"hy":1058,"storey":"single","type":"4"},
    {"id":"19","label":"19","x":1218,"y":44,"hx":1279,"hy":68,"storey":"double","type":"3A","extra":"stage 2B"},
    {"id":"20","label":"20","x":1215,"y":154,"hx":1276,"hy":177,"storey":"double","type":"3A","extra":"mirrored, stage 2B"},
    {"id":"21","label":"21","x":1220,"y":339,"hx":1281,"hy":362,"storey":"double","type":"1B"},
    {"id":"22","label":"22","x":1221,"y":456,"hx":1282,"hy":479,"storey":"double","type":"1B"},
    {"id":"23","label":"23","x":1218,"y":642,"hx":1279,"hy":665,"storey":"double","type":"3A","extra":"stage 2B"},
    {"id":"24","label":"24","x":1215,"y":751,"hx":1276,"hy":774,"storey":"double","type":"3A","extra":"mirrored, stage 2B"},
    {"id":"25","label":"25","x":1206,"y":945,"hx":1267,"hy":968,"storey":"double","type":"3A","extra":"stage 2B"},
    {"id":"26","label":"26","x":1203,"y":1054,"hx":1264,"hy":1077,"storey":"double","type":"3A","extra":"mirrored, stage 2B"},
    {"id":"27","label":"27","x":1518,"y":46,"hx":1579,"hy":70,"storey":"double","type":"1B"},
    {"id":"28","label":"28","x":1518,"y":164,"hx":1579,"hy":187,"storey":"double","type":"1B"},
    {"id":"29","label":"29","x":1573,"y":378,"hx":1573,"hy":378,"storey":"double","extra":"No label on the drawing. Sits above Lot 30"},
    {"id":"30","label":"30","x":1528,"y":460,"hx":1587,"hy":484,"storey":"double","type":"1A"},
    {"id":"31","label":"31","x":1523,"y":641,"hx":1584,"hy":664,"storey":"double","type":"3A","extra":"stage 2B"},
    {"id":"32","label":"32","x":1520,"y":750,"hx":1581,"hy":773,"storey":"double","type":"3A","extra":"mirrored, stage 2B"},
    {"id":"33","label":"33","x":1578,"y":972,"hx":1578,"hy":972,"storey":"double","type":"3A","extra":"stage 2B"},
    {"id":"34","label":"34","x":1519,"y":1044,"hx":1580,"hy":1067,"storey":"double","type":"3A","extra":"mirrored, stage 2B"}],"links":{}}
};
