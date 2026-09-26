// Shows the rules inside a THorn HTTP rule link (https://thorn-http.dev/r#1.<data>). <data> is
// the rules as JSON, deflate-compressed and base64url-encoded (app/src/features/rules/sharing/ruleLink.ts).
// With the extension installed, its content script marks <html data-thorn-http="installed"> and
// handles the "Import" button.
(function () {
  var RULE_TYPE_NAMES = {
    Redirect: "Redirect Request",
    Replace: "Replace String",
    QueryParam: "Query Param",
    Cancel: "Cancel Request",
    Delay: "Delay Request",
    Headers: "Modify Headers",
    UserAgent: "User-Agent",
    Request: "Modify Request Body",
    Response: "Modify API Response",
    Script: "Insert Script",
  };

  var status = document.getElementById("status");
  var list = document.getElementById("rules");

  function show(id) {
    document.getElementById(id).hidden = false;
  }

  function fail(message) {
    status.textContent = message;
    status.classList.add("error");
  }

  async function readLink() {
    var payload = location.hash.slice(1);
    var parts = payload.split(".");
    if (parts[0] !== "1" || !/^[\w-]+$/.test(parts[1] || "")) {
      throw new Error("This isn't a THorn HTTP rule link, or it was cut short.");
    }
    var base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    var binary = atob(base64 + "===".slice((base64.length + 3) % 4));
    var bytes = Uint8Array.from(binary, function (c) {
      return c.charCodeAt(0);
    });
    try {
      var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      var rules = JSON.parse(await new Response(stream).text());
    } catch (e) {
      throw new Error("This link is damaged. Ask for the link again, or for the rules as a file.");
    }
    if (!Array.isArray(rules) || !rules.length) throw new Error("This link doesn't contain any rules.");
    return rules;
  }

  function render(rules) {
    status.textContent =
      rules.length === 1 ? "Someone shared 1 rule with you:" : "Someone shared " + rules.length + " rules with you:";
    rules.forEach(function (rule) {
      var item = document.createElement("li");
      var type = document.createElement("span");
      type.className = "rule-type";
      type.textContent = RULE_TYPE_NAMES[rule.ruleType] || rule.ruleType;
      var name = document.createElement("span");
      name.textContent = rule.name;
      item.append(type, name);
      list.append(item);
    });
    show("rules");
    show(document.documentElement.dataset.thornHttp === "installed" ? "installed" : "not-installed");
  }

  function download(rules) {
    // Same format as the editor's "Export": importable with Import > JSON file.
    var records = rules.map(function (rule) {
      return Object.assign({}, rule, {
        id: rule.ruleType + "_" + Math.random().toString(36).slice(2, 8),
        status: "Inactive",
      });
    });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(records, null, 2)], { type: "application/json" }));
    link.download = "thorn-rules.json";
    link.click();
  }

  readLink().then(
    function (rules) {
      render(rules);
      document.getElementById("download").addEventListener("click", function () {
        download(rules);
      });
      document.getElementById("thorn-import").addEventListener("click", function () {
        status.textContent = "Opening THorn HTTP…";
      });
    },
    function (error) {
      fail(error.message);
    }
  );
})();
