"""Generate the Markdown tables for docs/goal-model.md from TRACE (single source of truth)."""
import sys
import goal_model_unified as m

def fmt_cond(t): return f"{t['name']} **If** {t['cond']}" if t["cond"] else t["name"]

def unified_table():
    rows = ["| ID | Type | Goal | Agent | Cat. | Sprint | Merged from (member goal) | Interview evidence |",
            "|---|---|---|---|---|---|---|---|"]
    for gid in sorted(m.TRACE, key=lambda k: (k[0] != "G", int(k.split("-")[1]))):
        t = m.TRACE[gid]
        flag = "✅" if t["sprint"] else ""
        if t["rejected"]: flag = "✖ rejected"
        name = fmt_cond(t) + (" *(tacit)*" if t["tacit"] else "")
        rows.append(f"| {gid} | {t['kind']} | {name} | {t['agent'] or '—'} | {t['cat']} | {flag} | "
                    f"{', '.join(t['merged']) or '—'} | {', '.join(t['src']) or '— (not in transcript)'} |")
    return "\n".join(rows)

def reverse_table():
    absorbed, _ = m.check_coverage()
    out = []
    for who, label in [("YH", "Yunhan"), ("LN", "Lynn"), ("YG", "Ying")]:
        out.append(f"\n**{label} ({who})**\n\n| Member goal | → Unified |\n|---|---|")
        for mid in m.MEMBER_GOALS[who]:
            out.append(f"| {who} {mid} | {', '.join(absorbed[(who, mid)])} |")
    return "\n".join(out)

if __name__ == "__main__":
    print(unified_table() if sys.argv[1] == "unified" else reverse_table())
