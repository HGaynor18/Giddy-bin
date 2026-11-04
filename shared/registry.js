// Tools the hub shows under "Tools", such as a quoting app or a drain-measuring tool.
//
// Work sites are no longer listed here: they live in Firestore and are made in Admin > Site editor.
// Each entry: { id, kind: "tool", name, detail, path }. Its id is also what gets ticked on the Admin page,
// and any data it keeps belongs under spaces/<id>/... in Firestore.
window.GB_REGISTRY = [
  // { id: "quoting", kind: "tool", name: "Quoting", detail: "Price a job and send the PDF", path: "tools/quoting/" },
  // { id: "drains", kind: "tool", name: "Drain measuring", detail: "Measure runs off a scaled plan", path: "tools/drains/" },
];
