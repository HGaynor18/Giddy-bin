// Every work site or tool the hub knows about.
//
// To add a new one:
//   1. Copy a folder under sites/ (or make one under tools/) and give it a new id.
//   2. In that page, set window.GB_SPACE to the same id.
//   3. Add an entry below. Its data lives in Firestore under spaces/<id>/...
//   4. Tick it for people in the Admin page.
window.GB_REGISTRY = [
  {
    id: "peninsula-view",
    kind: "site",
    name: "Peninsula View",
    detail: "Stage 2, 34 units. Unit notes, materials on site, morning checks.",
    path: "sites/peninsula-view/"
  }
  // { id: "next-job", kind: "site", name: "Next Job", detail: "...", path: "sites/next-job/" },
  // { id: "van-stock", kind: "tool", name: "Van stock", detail: "What is in each van", path: "tools/van-stock/" },
];
