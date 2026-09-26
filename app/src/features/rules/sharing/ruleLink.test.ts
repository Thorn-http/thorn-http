import { describe, expect, it } from "vitest";
import { createRuleLink, readRuleLink, RULE_LINK_BASE } from "./ruleLink";

const redirectRule = {
  id: "Redirect_abc",
  groupId: "Group_1",
  status: "Active",
  expiresAt: 123,
  currentOwner: "someone",
  objectType: "rule",
  ruleType: "Redirect",
  name: "Prod → local",
  pairs: [
    {
      id: "p1",
      source: { key: "Url", operator: "Contains", value: "example.com/api" },
      destination: "http://localhost:3000",
    },
  ],
} as any;

describe("rule links", () => {
  it("round-trips rules through a link, without local-only fields", async () => {
    const link = await createRuleLink([redirectRule]);
    expect(link.startsWith(`${RULE_LINK_BASE}1.`)).toBe(true);

    const rule = (await readRuleLink(link))[0]!;
    expect(rule.name).toBe("Prod → local");
    expect(rule.pairs).toEqual(redirectRule.pairs);
    ["id", "groupId", "status", "expiresAt", "currentOwner"].forEach((field) => expect(rule).not.toHaveProperty(field));
  });

  it("accepts the bare payload as well as the whole link", async () => {
    const link = await createRuleLink([redirectRule]);
    const payload = link.split("#")[1]!;
    expect((await readRuleLink(payload))[0]!.name).toBe("Prod → local");
    expect((await readRuleLink(`  ${link}  `))[0]!.name).toBe("Prod → local");
  });

  it("rejects links that are not THorn HTTP links, are damaged or hold no valid rules", async () => {
    await expect(readRuleLink("https://thorn-http.dev/r#")).rejects.toThrow("isn't a THorn HTTP rule link");
    await expect(readRuleLink("https://thorn-http.dev/r#2.abc")).rejects.toThrow("isn't a THorn HTTP rule link");
    await expect(readRuleLink("https://thorn-http.dev/r#1.<script>")).rejects.toThrow("isn't a THorn HTTP rule link");

    const link = await createRuleLink([redirectRule]);
    await expect(readRuleLink(link.slice(0, -6))).rejects.toThrow("damaged");

    const notARule = await createRuleLink([{ ...redirectRule, ruleType: "Unknown" }]);
    await expect(readRuleLink(notARule)).rejects.toThrow("doesn't contain valid rules");
  });
});
