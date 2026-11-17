"""Generate the Markdown tables for docs/goal-model.md from TRACE (single source of truth).

Usage: python export_tables.py unified | reverse | v2
"""
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

def v2_table():
    """Every V2 change recorded in the model (notes, conflicts, obstacles tagged 'V2:')."""
    rows = ["| Element | V2 change (from the model) |", "|---|---|"]
    for gid in sorted(m.TRACE, key=lambda k: (k[0] != "G", int(k.split("-")[1]))):
        note = m.TRACE[gid]["note"]
        if "V2:" in note:
            rows.append(f"| {gid} {m.TRACE[gid]['name']} | {note[note.index('V2:') + 4:]} |")
    for cid, (a, b, what, decision, _) in m.CONFLICTS.items():
        if "V2:" in decision:
            rows.append(f"| {cid} {a} vs. {b} ({what}) | {decision[decision.index('V2:') + 4:]} |")
    for oid, o in m.OBSTACLES.items():
        if "V2:" in o.get("accepted_risk", ""):
            rows.append(f"| {oid} {o['name']} | {o['accepted_risk'][4:]} |")
    return "\n".join(rows)

if __name__ == "__main__":
    print({"unified": unified_table, "reverse": reverse_table, "v2": v2_table}[sys.argv[1]]())
