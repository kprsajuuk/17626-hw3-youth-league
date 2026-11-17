"""
17-626 HW4 (Spec-Driven Development) - Step 1/2: unified team goal model.

Merges the three HW2 combined goal models of our team:
    YH = Yunhan  (HW2/model-v2/goal_model_combined.py + individual models, G-1..G-42)
    LN = Lynn    (HW2-lynn/goal_model_combined.py + individual models,    G-1..G-56)
    YG = Ying    (HW2-ying/goal_model_combined.py,                         G-1..G-84, D-1..D-5, O-1..O-2)

Each member interviewed the same three Clarity personas (Brenda Kowalski - league
administrator, Mike Tanaka - parent, Ray Delgado - coach) separately, so there are three
transcript sets. Evidence is cited per member transcript set:
    YH:B63  = Yunhan's Brenda transcript, stakeholder turn [63]   (HW1/Report-1..3)
    LN:M35  = Lynn's  Mike transcript, turn [35]                  (HW2-lynn/transcript - 1..3.pdf)
    YG:R112 = Ying's  Ray transcript, turn 112                    (HW2-ying/*.csv)

The three member models used colliding IDs (e.g. every model has a "G-7"), so the unified
model is renumbered G-01..G-85. Every unified goal records which member goals it absorbs
(`merged`), so nothing from HW2 is lost; check_coverage() verifies this.

SPINE (root abstracted from the three roots YH G-24, LN G-56, YG G-1; H12):
    G-01 Improve[SafeAndWellCoordinatedGameDay]
      A STATUS    G-02  official status is clear and current        (Brenda-led)
      B REACH     G-21  the right families know the official status (all three)
      C ACT       G-40  each child's ride is confirmed              (Mike-led)
      D LIABILITY G-58  league is not liable for rides/custody      (Brenda constraint)
      E PRIVACY   G-62  child safety and privacy                    (Brenda + Mike)
      F RECORDS   G-71  fair playing time / shared coach records    (Ray)
      G ADOPTION  G-77  usable by busy parents and volunteers       (NFR, all three)

SPRINT SCOPE (`sprint=True`; `python goal_model_unified.py sprint` draws only these branches): the change -> official notice ->
families see & acknowledge chain (A + B, with the custody constraint). See goal-model.md.

Conflicts CF-1..CF-8 are kept as ConflictLinks; rejected alternatives stay in the model.
Sprint membership, tacit goals and rejected alternatives are recorded in TRACE (sprint/tacit/rejected flags).

V2 (after evaluating Prototype V1; see docs/v2-change-request.md and goal-model.md section 6):
    D-6  new domain property: a change is pending only until a FINAL notice exists   (CR-1, OBS-1)
    D-7  new domain property: an official cancellation is final (team assumption)     (CR-2, OBS-2)
    notes added to G-07, G-11, G-13, G-14, D-2 (CR-1, CR-2, CR-5, CR-6), G-33, D-4 (CR-8),
    G-30 (CR-9), CF-3 and O-1 (CR-3). Every V2 change is tagged "V2:" in its note.
"""
from goalmodeling.schema import *

ENV, SW = AgentType.ENVIRONMENT_AGENT, AgentType.SOFTWARE_AGENT

ADMIN = ("LeagueAdministrator", ENV)
COACH = ("Coach", ENV)
PARENT = ("Parent", ENV)
DRIVER = ("DrivingParent", ENV)
CITY = ("CityOrParksDept", ENV)
SCHEDULE = ("ScheduleService", SW)
NOTIFY = ("NotificationService", SW)
ACCESS = ("AccessControl", SW)
AUDIT = ("AuditLog", SW)
FAMILY = ("FamilyView", SW)
RIDES = ("RideBoard", SW)
ROSTER = ("RosterService", SW)
RECORDS = ("TeamRecords", SW)
CHANNEL = ("TeamChannel", SW)
APP = ("MobileApp", SW)
PLATFORM = ("LeaguePlatform", SW)

TRACE = {}          # unified id -> metadata (used by the docs/tables and the coverage check)
NODES = {}
SPRINT_NODES, TACIT_NODES, REJECTED_NODES = [], [], []
KIND = {AchieveGoal: "Achieve", MaintainGoal: "Maintain", AvoidGoal: "Avoid", SoftGoal: "Soft"}


def g(cls, gid, name, cond=None, agent=None, ref=None, src=(), merged=(), cat="F",
      sprint=False, tacit=False, rejected=False, note=""):
    """One unified goal.
    ref     : a Refinement (AND) or a list of Refinements (OR alternatives)
    src     : interview evidence, e.g. ("YH:B63", "LN:M35", "YG:R112")
    merged  : member goals absorbed, e.g. ("YH G-4", "LN G-10", "YG G-6")
    cat     : F (functional) or NFR
    """
    text = f"<b>{gid}</b> {name}"
    if cond:
        text += f" <b>If</b> {cond}"
    refinements = ref if isinstance(ref, list) else ([ref] if ref else None)
    performs = [PerformanceLink(Agent(*agent), None)] if agent else None
    node = cls(text, performs=performs, refinements=refinements, leaf=bool(agent))
    TRACE[gid] = dict(id=gid, kind=KIND[cls], name=name, cond=cond,
                      agent=agent[0] if agent else None, src=list(src), merged=list(merged),
                      cat=cat, sprint=sprint, tacit=tacit, rejected=rejected, note=note)
    NODES[gid] = node
    if sprint:
        SPRINT_NODES.append(node)
    if tacit:
        TACIT_NODES.append(node)
    if rejected:
        REJECTED_NODES.append(node)
    return node


def dom(did, text, src=(), merged=(), sprint=False, note=""):
    node = DomainProperty(f"<b>{did}</b> {text}", leaf=True)
    TRACE[did] = dict(id=did, kind="Domain", name=text, cond=None, agent=None, src=list(src),
                      merged=list(merged), cat="-", sprint=sprint, tacit=False, rejected=False, note=note)
    NODES[did] = node
    if sprint:
        SPRINT_NODES.append(node)
    return node


def AND(code, *children, complete=True):
    """AND-refinement. complete=False when the children cannot guarantee the parent (e.g. P7, soft goals)."""
    return Refinement(complete, list(children), annotation=code)


def ALT(code, *children):
    """One alternative of an OR-refinement."""
    return Refinement(False, list(children), annotation=code)


A, M, V, S = AchieveGoal, MaintainGoal, AvoidGoal, SoftGoal

# =============================== A  STATUS =================================================
g03 = g(A, "G-03", "ChangeVerifiedWithCityOrParks", cond="GameChanged", agent=ADMIN, sprint=True,
        src=("YH:B20", "YH:B40", "YH:B59", "YH:R38", "YH:R40", "LN:B30", "LN:B34", "LN:B36", "YG:B111", "YG:B17"),
        merged=("YH G-3", "LN G-9", "LN G-7", "YG G-5", "YG G-4"))
d01 = dom("D-1", "City usually decides rainouts by ~3 p.m.; timing not guaranteed",
          src=("YH:B20", "YH:B40", "YG:B102", "YG:B105"), merged=("YG D-1",), sprint=True)
g04 = g(A, "G-04", "OfficialStatusPublished", cond="ChangeVerified", agent=ADMIN, sprint=True,
        src=("YH:B14", "YH:B16", "YH:B55", "YH:B59", "YH:R25", "LN:B34", "LN:B59", "YG:B111", "YG:B113"),
        merged=("YH G-4", "YH G-19", "LN G-10", "YG G-6", "YG G-3"))
g05 = g(V, "G-05", "StatusShownAsOfficial", cond="Not PublishedByAdministrator", agent=ACCESS, cat="NFR", sprint=True,
        src=("YH:B16", "YH:B55", "YH:B57", "LN:B30", "LN:B38", "LN:B52", "LN:B68", "YG:B113"),
        merged=("YH G-5", "LN G-16", "YG G-7"), note="security / authorization")
g06 = g(M, "G-06", "ChangesNoticesAndSharesLoggedWithAuthorAndTime", agent=AUDIT, cat="NFR", sprint=True,
        src=("YH:B52", "YH:B63", "YH:R59", "LN:B45", "LN:B48", "LN:B70", "YG:B55", "YG:M73", "YG:B73"),
        merged=("YH G-5", "LN G-17", "YG G-9", "YG G-58"), note="accountability")

# early warning while a change is still pending: OR (CF-1, CF-2)
g08 = g(A, "G-08", "HeadsUpSentMarkedUnconfirmed", cond="ChangePending", agent=COACH, sprint=True,
        src=("YH:R52", "YH:R54", "YH:R63", "YH:M73", "YH:B59", "YG:B20", "YG:R47"),
        merged=("YH G-18", "YH G-40", "YG G-24"))
g09 = g(A, "G-09", "GameUpdatedDirectlyByCoach", cond="LastMinuteChange", agent=COACH, rejected=True,
        src=("LN:R19", "LN:R21"), merged=("LN G-39",), note="rejected alternative (CF-2)")
# V2 (CR-1, OBS-1): "pending" made explicit, so a heads-up cannot follow a FINAL notice
d06 = dom("D-6", "A change is pending only until a FINAL notice for that game is published", sprint=True,
          note="V2: added after V1 evaluation (CR-1, OBS-1); team definition, no interview evidence")
g07 = g(A, "G-07", "FamiliesWarnedEarly", cond="ChangePending", sprint=True,
        ref=[ALT("H7", g08, d06), ALT("H7", g09)],
        src=("YH:R25", "YH:R52", "YH:R54", "YH:B26", "YH:B59"), merged=("YH G-16",),
        note="V2: condition made explicit after V1 evaluation (CR-1, OBS-1, D-6)")

g10 = g(A, "G-10", "NoticeMarkedFinalWithAuthor", cond="ChangeVerified", agent=NOTIFY, sprint=True,
        src=("YH:R46", "YH:R59", "YH:R63", "YH:B63", "YH:M76", "LN:B28", "LN:B30", "LN:B50", "YG:B89"),
        merged=("YH G-15", "LN G-15"), note="usability")

g12 = g(A, "G-12", "GameMarkedCancelledOrMoved", cond="OfficialStatusPublished", agent=SCHEDULE, sprint=True,
        src=("YG:B55", "YG:B89", "LN:B36", "LN:B38"), merged=("YG G-11", "YG G-12", "LN G-6", "LN G-8"))
g13 = g(A, "G-13", "CancelMarkCleared", cond="NoticeWithdrawn", agent=SCHEDULE, tacit=True,
        merged=("YG G-13",),
        note="tacit edge case. V2: reversal blocked; cancellation treated as final (CR-2 option B, D-7). "
             "Revisit if Brenda confirms reinstatement happens (OQ-5); D-1 is why it may be needed later")
g14 = g(A, "G-14", "OldAndNewDetailsAndActionShown", cond="FieldOrTimeChanged", agent=SCHEDULE, sprint=True,
        src=("YG:R39", "YG:M73", "YH:M76", "LN:B45", "LN:M11"),
        merged=("YG G-14", "YH G-26", "LN G-12", "LN G-25"),
        note="V2: one notice may change both field and time (CR-5, OBS-7)")
d02 = dom("D-2", "A game change is a cancellation, a field move or a time move",
          src=("YG:B10", "YG:R17"), merged=("YG D-3",), sprint=True,
          note="V2: a move may change the field, the time, or both (CR-5, OBS-7)")
# V2 (CR-2, OBS-2): option B - no change may follow a cancellation
d07 = dom("D-7", "An official cancellation is final (team assumption; confirm with Brenda, OQ-5)", sprint=True,
          note="V2: added after V1 evaluation (CR-2 option B, OBS-2); no interview evidence; risk against D-1 accepted")
g11 = g(A, "G-11", "GameEntryShowsCurrentStatus", cond="GameChanged", sprint=True,
        ref=AND("P2", g12, g13, g14, d02, d07), src=("YG:B29", "YG:B89"), merged=("YG G-10",),
        note="V2: started state made explicit (CR-6, OBS-8); no direct interview evidence")

# master schedule upkeep (out of sprint scope)
g16 = g(A, "G-16", "ConflictShownAgainstFieldAvailability", cond="FieldOrTeamChangeReported", agent=SCHEDULE,
        src=("LN:B11", "LN:B16", "LN:B21"), merged=("LN G-5",))
g17 = g(A, "G-17", "FieldAssignmentUpdated", cond="ParksAvailabilityChanges", agent=ADMIN,
        src=("YG:B66", "YG:B102", "LN:B9", "LN:B16"), merged=("YG G-8", "LN G-4"))
d03 = dom("D-3", "Parks dept supplies field availability; it can change weekly",
          src=("YG:B102",), merged=("YG D-2",))
g19 = g(A, "G-19", "TeamListMismatchFlagged", cond="TeamMatrixDiffersFromMasterRoster", agent=ROSTER,
        src=("YG:B47", "YG:B55"), merged=("YG G-16", "YG G-80"))
g20 = g(A, "G-20", "DiscrepancyResolved", cond="MismatchFlagged", agent=ADMIN,
        src=("YG:B52",), merged=("YG G-17",))
g18 = g(A, "G-18", "ScheduleSentToCorrectTeams", ref=AND("H11", g19, g20),
        src=("YG:B47", "YG:B49"), merged=("YG G-15",))
g15 = g(M, "G-15", "MasterScheduleCurrent", ref=AND("H4", g16, g17, d03, g18),
        src=("YG:B66", "LN:B9"), merged=())

g02 = g(M, "G-02", "OfficialStatusClearAndCurrent", sprint=True,
        ref=AND("P1", g03, d01, g04, g05, g06, g07, g10, g11, g15),
        src=("YH:B8", "YH:B14", "YH:B63", "YH:R44", "YH:R61", "LN:B7", "LN:B23", "LN:B56", "YG:B24", "YG:B89", "YG:M84", "YG:R51"),
        merged=("YH G-2", "LN G-2", "LN G-3", "LN G-14", "YG G-2"))

# =============================== B  REACH ==================================================
g24 = g(A, "G-24", "CustodyRestrictionReviewed", cond="CourtOrderOnFile", agent=ADMIN, cat="NFR", sprint=True,
        src=("YG:B70", "YG:B73"), merged=("YG G-54",))
g25 = g(M, "G-25", "RestrictedParentExcludedFromMessages", agent=ACCESS, cat="NFR", sprint=True,
        src=("YG:B66", "YH:B32"), merged=("YG G-55",), note="confidentiality")
d04 = dom("D-4", "Some families have court orders on file", src=("YG:B66", "YH:B32"),
          merged=("YG D-4",), sprint=True,
          note="V2: also constrains confirmation; a restricted parent's confirmation never covers the restricted child (CR-8, OBS-10)")
g23 = g(V, "G-23", "RestrictedParentGetsChildInfo", cond="CourtOrderOnFile", cat="NFR", sprint=True,
        ref=AND("H11", d04, g24, g25), src=("YG:B66", "YH:B30", "YH:B32"), merged=("YG G-53",))
g22 = g(A, "G-22", "NoticeTargetedToAffectedTeamsOnly", cond="StatusPublished", agent=NOTIFY, sprint=True,
        src=("YH:B30", "YH:B42", "YH:B46", "YH:R42", "YH:R44", "YG:B111", "YG:B24", "YG:R20", "LN:B21"),
        merged=("YH G-7", "YH G-17", "YG G-19", "YG G-25"))

g27 = g(A, "G-27", "InAppAlertAndEmailSent", cond="StatusPublished", agent=NOTIFY, sprint=True,
        src=("YH:B49", "YH:B52", "YH:M23", "LN:R21", "LN:M9", "YG:M73", "YG:B20"),
        merged=("YH G-9", "YH G-28", "YH G-38", "LN G-24", "LN G-41", "LN G-42", "YG G-21", "YG G-23"))
g29 = g(A, "G-29", "TextSentWithEveryNotice", cond="StatusPublished", agent=NOTIFY, rejected=True,
        src=("YH:M23", "YH:M73", "YH:B49"), merged=("YH G-39", "LN G-43"), note="rejected alternative (CF-3)")
g30 = g(A, "G-30", "TextSent", cond="NotAckedWithin5Min Or ChangeUrgent", agent=NOTIFY, sprint=True,
        src=("YG:M73", "YH:M23", "YH:M73"), merged=("YG G-22",),
        note="5 min from YG; 'urgent' = kickoff within 2 h (YH UC-01) - assumption. "
             "V2: applies to coaches as well as parents; calls stay parents-only (CR-9, OBS-11; ask Ray, OQ-9)")
g28 = g(A, "G-28", "TextAlertDelivered", cond="StatusPublished", sprint=True,
        ref=[ALT("H6", g30), ALT("H6", g29)], src=("YH:M23", "YH:M73", "YG:M73"), merged=())
g31 = g(A, "G-31", "CallPlaced", cond="ChangeUrgent", agent=NOTIFY, cat="NFR", sprint=True,
        src=("YH:M23", "YH:M60", "YH:M67", "YH:M69"), merged=("YH G-29",), note="performance / timeliness")
g32 = g(A, "G-32", "DetailsRelayedByPhone", cond="ParentHasNoSmartphone", agent=COACH,
        src=("LN:R44", "YH:R27"), merged=("LN G-44",))
g26 = g(A, "G-26", "NoticeDelivered", cond="StatusPublished", sprint=True,
        ref=AND("H5", g27, g28, g31, g32), src=("YH:B49", "LN:R21", "YG:B111", "YG:M73"),
        merged=("YG G-20",))

g34 = g(A, "G-34", "RecipientAcknowledges", cond="AlertReceived", agent=PARENT, sprint=True,
        src=("YG:M73", "YG:R41", "LN:B45", "LN:B48", "LN:B61"), merged=("YG G-27", "LN G-13"))
g35 = g(M, "G-35", "ChangeAlertVisible", cond="Not Acknowledged", agent=FAMILY, sprint=True,
        src=("LN:M11", "LN:M59"), merged=("LN G-26",))
g36 = g(M, "G-36", "AckStatusShownPerRecipient", agent=NOTIFY, sprint=True,
        src=("YH:B36", "YH:R15", "YH:R31", "YH:M30", "LN:R23", "LN:R25", "LN:R51", "YG:R41", "YG:B55", "YG:B59"),
        merged=("YH G-10", "YH G-21", "LN G-45", "YG G-28"))
g37 = g(A, "G-37", "NonAcknowledgerContacted", cond="NoAckBeforeDeparture", agent=COACH, sprint=True,
        src=("YH:R31", "YH:R33", "YH:M30", "YG:R41"), merged=("YH G-22", "YG G-29"))
g33 = g(A, "G-33", "ReceiptConfirmed", cond="NoticeSent", sprint=True,
        ref=AND("P6", g34, g35, g36, g37), src=("YH:R15", "YH:R31", "YH:B36", "YG:R39", "YG:R92", "YG:B59"),
        merged=("YH G-20", "YG G-26"),
        note="V2: receipt confirmation counted per child, not per family (CR-8, OBS-10); assumption, ask Brenda (OQ-8)")
g38 = g(V, "G-38", "ReadGuaranteeImplied", agent=NOTIFY, cat="NFR", sprint=True,
        src=("YG:B24", "YG:B100", "YG:B111"), merged=("YG G-30",), note="honesty about what an ack means")

g39 = g(M, "G-39", "EachChildGameStatusInOneView", agent=FAMILY, sprint=True,
        src=("YH:M12", "YH:M14", "YH:M65", "LN:M5", "LN:M9", "LN:B28", "YG:M42", "YG:M84", "YG:M105"),
        merged=("YH G-27", "LN G-15", "LN G-22", "LN G-23", "YG G-31"),
        note="V1 shows game status per child; ride status deferred with branch C")

g21 = g(A, "G-21", "FamiliesKnowOfficialStatus", cond="StatusPublished", sprint=True,
        ref=AND("P7", g22, g23, g26, g33, g38, g39, complete=False),
        src=("YH:B46", "YH:B59", "YH:R46", "YH:M26", "YH:M63", "LN:B21", "LN:M9", "LN:R7", "LN:R21", "YG:M39", "YG:R92", "YG:B10"),
        merged=("YH G-6", "YH G-25", "LN G-11", "LN G-38", "LN G-40", "YG G-18"))

# =============================== C  ACT (rides) ============================================
g41 = g(A, "G-41", "ParentDrivesChild", cond="ParentAvailable", agent=PARENT,
        src=("LN:M43",), merged=("LN G-28",))
g43 = g(A, "G-43", "RideNeedOrOfferPostedByParent", cond="NeedOrSpareSeat", agent=PARENT,
        src=("YH:B14", "YH:B34", "YH:R27", "YH:R31", "YH:M12", "LN:R9", "LN:R23", "LN:M61", "YG:R62", "YG:R47", "YG:B83"),
        merged=("YH G-12", "YH G-23", "YH G-32", "LN G-31", "LN G-52", "YG G-39", "YG G-40"))
g44 = g(A, "G-44", "DriverTrustedByParent", cond="MetInPersonOrVouchedByCoach", agent=PARENT,
        src=("LN:M53", "YG:M96"), merged=("LN G-32", "YG G-46", "YG G-47", "YG G-48"))
g45 = g(V, "G-45", "RestrictedInfoInRideDiscussion", agent=RIDES, cat="NFR",
        src=("YH:B30", "YH:B32", "YH:B63"), merged=("YH G-8",))
g46 = g(A, "G-46", "NearbyTrustedParentSuggested", cond="RideRequested", agent=RIDES,
        src=("LN:M14", "LN:M43", "LN:M59", "LN:M61", "YG:M25"), merged=("LN G-30", "YG G-41"))
g47 = g(A, "G-47", "FamiliesMatchedOrBackupFoundByCoach", cond="RideNeededOrFallsThrough", agent=COACH, rejected=True,
        src=("YH:M38", "YH:M52", "LN:R44", "YG:R59"), merged=("YH G-33", "YH G-42", "LN G-53", "YG G-42"),
        note="rejected alternative (CF-5)")
g42 = g(A, "G-42", "RideSecured", cond="ParentUnavailable",
        ref=[ALT("H7", g43, g44, g45), ALT("H7", g46), ALT("H7", g47)],
        src=("YH:M6", "YH:M14", "YH:M36", "YH:R31", "LN:M14", "LN:M35", "LN:M53", "YG:B55", "YG:R56"),
        merged=("YH G-31", "YH G-41", "LN G-29", "LN G-21"))
g48 = g(A, "G-48", "RideDetailsAndDriverContactInOneMessage", cond="RideAgreed", agent=RIDES,
        src=("YG:M67", "YG:M100"), merged=("YG G-43", "YG G-45"))
g49 = g(M, "G-49", "CoachSeesWhetherPlayersCovered", agent=RIDES,
        src=("YG:R59", "LN:R9", "LN:R36", "LN:R44"), merged=("YG G-44", "LN G-51"))
g51 = g(A, "G-51", "AffectedRideFlagged", cond="ScheduleChangeAffectsRide", agent=NOTIFY,
        src=("YG:M73",), merged=("YG G-37",))
g52 = g(A, "G-52", "RideReconfirmedByDriver", cond="RideFlagged", agent=DRIVER,
        src=("YH:M36", "YH:M46", "YH:M48", "YH:M63", "YH:R56", "YH:R59"), merged=("YH G-34",))
g50 = g(A, "G-50", "RideReconfirmed", cond="GameChanged", ref=AND("P1", g51, g52),
        src=("YH:M46", "YG:M73"), merged=())
g54 = g(A, "G-54", "PickupConfirmedByDriver", cond="ChildPickedUp", agent=DRIVER,
        src=("YH:M14", "YH:M16", "YH:M18", "YH:M82", "LN:M35", "LN:M46", "LN:M51", "YG:M32"),
        merged=("YH G-36", "LN G-34", "YG G-34"))
g55 = g(A, "G-55", "PickupStatusShownToParent", cond="DriverConfirms", agent=RIDES,
        src=("YG:M45", "LN:M35", "LN:M37"), merged=("YG G-35", "LN G-35"))
g56 = g(A, "G-56", "MissedPickupAlertSent", cond="Not ConfirmedByPickupTime", agent=NOTIFY, cat="NFR",
        src=("YH:M18", "YG:M42"), merged=("YH G-37", "YG G-38", "YG G-36"), note="safety")
g57 = g(A, "G-57", "BackupRideRequested", cond="DriverDelayedOrCancels", agent=PARENT,
        src=("LN:M37",), merged=("LN G-36",))
g53 = g(M, "G-53", "PickupKnownToParent", cond="RideByAnotherDriver", ref=AND("P6", g54, g55, g56),
        src=("YH:M14", "YH:M18", "YH:M82", "LN:M35", "LN:M46", "YG:M58", "YG:M84"),
        merged=("YH G-35", "LN G-33", "YG G-33"))
g40 = g(A, "G-40", "ChildRideConfirmed", cond="GameScheduled",
        ref=[ALT("P2", g41), ALT("P2", g42, g48, g49, g50, g53)],
        src=("YH:M14", "YH:M20", "YH:M36", "YH:M82", "LN:M14", "LN:M24", "LN:M43", "YG:M42", "YG:M128", "YG:R59"),
        merged=("YH G-30", "LN G-27", "YG G-32"))

# =============================== D  LIABILITY ==============================================
g59 = g(V, "G-59", "SystemAssignsDriversOrApprovesRides", agent=RIDES,
        src=("LN:B54", "LN:B70", "YG:B83", "YG:B100"), merged=("LN G-19", "YG G-64"))
g60 = g(V, "G-60", "RideShownAsLeagueGuaranteed", agent=RIDES,
        src=("YG:B80", "YG:B83"), merged=("YG G-65",))
g61 = g(A, "G-61", "FamilyResponsibilityNoticeShown", cond="RideBoardOpened", agent=RIDES,
        src=("YH:B24", "YH:B32", "YH:B34"), merged=("YH G-13", "YG G-66"))
g58 = g(V, "G-58", "LeagueLiableForRidesOrCustody", ref=AND("H8", g59, g60, g61), cat="NFR",
        src=("YH:B10", "YH:B14", "YH:B34", "YH:B61", "YH:R8", "LN:B50", "LN:B54", "LN:B63", "LN:B68", "YG:B10", "YG:B68"),
        merged=("YH G-11", "LN G-18", "LN G-1", "YG G-63"))

# =============================== E  PRIVACY ================================================
g63 = g(M, "G-63", "FamilyInfoVisibleOnlyToAuthorizedRoles", agent=ACCESS, cat="NFR",
        src=("LN:B50", "LN:B70", "LN:B74"), merged=("LN G-20",))
g64 = g(V, "G-64", "UnnecessaryPersonalInfoShown", agent=ACCESS, cat="NFR",
        src=("YG:B66", "YG:B70", "YG:B73", "YG:M96", "LN:M14"), merged=("YG G-50", "YG G-51", "YG G-52"),
        note="no child full name / home address for rides; no public photos")
d05 = dom("D-5", "Insurer requires background checks for drivers of non-family children",
          src=("YG:B66",), merged=("YG D-5",))
g66 = g(A, "G-66", "ApprovedDriverRecordReviewed", cond="DriverStatusRelevant", agent=ADMIN, cat="NFR",
        src=("YG:B66", "YG:B70", "YG:B73"), merged=("YG G-57",))
g65 = g(M, "G-65", "BackgroundCheckOnFile", cond="DriverCarriesNonFamilyChild", cat="NFR",
        ref=AND("H11", d05, g66), src=("YG:B66",), merged=("YG G-56",))
g67 = g(A, "G-67", "SharedInfoCorrected", cond="RestrictionChanges", agent=ADMIN, cat="NFR",
        src=("YG:B73",), merged=("YG G-59",))
g69 = g(A, "G-69", "CustodyGuardChecked", cond="ParentRequestsView", agent=ACCESS, cat="NFR", tacit=True,
        merged=("YG G-61",))
g70 = g(A, "G-70", "ChildMessagesShownToParent", cond="GuardPassed", agent=CHANNEL,
        src=("YG:M125",), merged=("YG G-62",))
g68 = g(M, "G-68", "ParentCanViewChildMessages", ref=AND("P4", g69, g70),
        src=("YG:M121", "YG:M123"), merged=("YG G-60",))
g62 = g(M, "G-62", "ChildSafetyAndPrivacy", cat="NFR", ref=AND("H3", g63, g64, g65, g67, g68),
        src=("YG:B66", "YG:B68"), merged=("YG G-49",))

# =============================== F  COACH RECORDS ==========================================
g73 = g(A, "G-73", "PlayerMarkedInOrOut", cond="AvailabilityRequested", agent=PARENT,
        src=("LN:R17", "LN:R19", "YG:R20", "YG:R30"), merged=("LN G-49", "YG G-69"))
g74 = g(A, "G-74", "AttendanceListShownToCoach", agent=RECORDS,
        src=("LN:R19", "YG:R88"), merged=("LN G-50", "YG G-70"))
g72 = g(A, "G-72", "PlayerAvailabilityKnown", cond="GameUpcoming", ref=AND("H5", g73, g74),
        src=("LN:R9", "LN:R17", "YG:R11"), merged=("LN G-48", "YG G-68"))
g75 = g(M, "G-75", "SamePlayingTimeRecordForBothCoaches", agent=RECORDS,
        src=("YG:R71", "YG:R85", "YG:R88", "YG:R109"), merged=("YG G-71", "YG G-72", "YG G-73"))
g76 = g(M, "G-76", "EachPlayerPlaysAtLeastHalfGame", agent=COACH,
        src=("YG:R71", "LN:R27", "LN:R40"), merged=("YG G-74", "LN G-47"))
g71 = g(S, "G-71", "Improve[PlayingTimeFairness]", ref=AND("H4", g72, g75, g76),
        src=("LN:R7", "LN:R27", "LN:R40", "YG:R92", "YG:R95"), merged=("LN G-46", "YG G-67"))

# =============================== G  ADOPTION (NFR) =========================================
g78 = g(A, "G-78", "KeyActionsWithin3Taps", agent=APP, cat="NFR",
        src=("YG:R112", "YG:M105", "LN:R54"), merged=("YG G-76", "LN G-55"))
g79 = g(M, "G-79", "ServiceUpDuringGameDayRush", agent=PLATFORM, cat="NFR",
        src=("YG:R112", "YG:M128"), merged=("YG G-77",))
g80 = g(A, "G-80", "AlertSentWithin1MinOfPublish", agent=NOTIFY, cat="NFR", sprint=True,
        src=("YG:R47",), merged=("YG G-78",), note="performance")
g81 = g(S, "G-81", "Reduce[ManualCommunicationWork]", cat="NFR",
        src=("YG:B89", "YG:B20"), merged=("YG G-79",), note="contributed to by G-36 ack list")
g83 = g(A, "G-83", "AlertMarkedUrgent", cond="GameChangeOrPickupAtRisk", agent=NOTIFY, cat="NFR", sprint=True,
        src=("YG:M84", "YG:M116", "YG:R39"), merged=("YG G-82",))
g84 = g(M, "G-84", "TeamAnnouncementsSeparateFromParentChat", agent=CHANNEL, cat="NFR",
        src=("YG:R32", "YG:R47"), merged=("YG G-83",))
g85 = g(V, "G-85", "DuplicateAndTrivialNotifications", agent=NOTIFY, cat="NFR", sprint=True,
        src=("YG:M77", "YG:B55"), merged=("YG G-84",))
g82 = g(S, "G-82", "Minimize[NotificationNoise]", cat="NFR", sprint=True, ref=AND("H6", g83, g84, g85, complete=False),
        src=("YG:M77", "YG:R20"), merged=("YG G-81",))
g77 = g(S, "G-77", "Increase[AdoptionByBusyParentsAndVolunteers]", cat="NFR",
        ref=AND("H6", g78, g79, g80, g81, g82, complete=False),
        src=("YG:R112", "YG:R47", "YG:M105", "LN:R54"), merged=("YG G-75", "LN G-54"))

# =============================== Root ======================================================
g01 = g(S, "G-01", "Improve[SafeAndWellCoordinatedGameDay]", sprint=True,
        ref=AND("H12", g02, g21, g40, g58, g62, g71, g77, complete=False),
        src=("YH:M20", "YH:M34", "YH:M82", "YH:B10", "YH:B26", "YH:R59", "LN:R7", "LN:R36"),
        merged=("YH G-24", "YH G-1", "YH G-14", "LN G-56", "LN G-37", "YG G-1"))

# =============================== Obstacles =================================================
o1 = Obstacle("<b>O-1</b> AlertMissedWhileOnShift")      # YH Mike obstacle; YG O-1 (YG:M25, YG:B20)
o2 = Obstacle("<b>O-2</b> DriverDelayedOrNoShow")         # LN Mike obstacle (LN:M35, LN:M37); YG O-2 (YG:M58)
OBSTACLES = {
    "O-1": dict(name="AlertMissedWhileOnShift", obstructs="G-26", resolved_by=["G-30", "G-31"],
                src=["YH:M23", "YG:M25", "YG:B20"], merged=["YH ParentOnShiftMissesText", "YG O-1"],
                accepted_risk="V2: heads-ups (G-08) never escalate to text or call; accepted risk (CR-3, OBS-4; ask Mike, OQ-6)"),
    "O-2": dict(name="DriverDelayedOrNoShow", obstructs="G-53", resolved_by=["G-56", "G-57"],
                src=["LN:M35", "LN:M37", "YG:M58"], merged=["LN DriverDelayedOrPlanFallsThrough", "YG O-2"]),
}

# =============================== Conflicts =================================================
CONFLICTS = {
    "CF-1": ("G-08", "G-04", "speed vs. verification", "compromise", True),
    "CF-2": ("G-09", "G-05", "coach updates game vs. only admin makes it official", "prioritize G-05", True),
    "CF-3": ("G-29", "G-85", "text on every notice vs. avoid duplicate notifications", "compromise via G-30; V2: urgent case unresolved (CR-3, OBS-3; ask Mike, OQ-6)", True),
    "CF-4": ("G-46", "G-59", "system suggests nearby parent vs. system must not match/approve", "unresolved - ask Brenda", False),
    "CF-5": ("G-47", "G-58", "coach arranges rides vs. league not liable", "prioritize G-58; inconsistent Ray interviews", False),
    "CF-6": ("G-56", "G-60", "missed-pickup alert vs. ride not shown as league-guaranteed", "unresolved - ask Brenda", False),
    "CF-7": ("G-44", "G-65", "parent's own trust vs. insurer background check", "domain constraint wins; both kept", False),
    "CF-8": ("G-68", "G-25", "parent sees child's messages vs. restricted parent excluded", "resolved by guard G-69", False),
}

links = [ConflictLink(NODES[a], NODES[b]) for a, b, *_ in CONFLICTS.values()] + [
    ObstructionLink(g26, o1), ResolutionLink(g30, o1), ResolutionLink(g31, o1),
    ObstructionLink(g53, o2), ResolutionLink(g56, o2), ResolutionLink(g57, o2),
]

# =============================== Coverage check ============================================
MEMBER_GOALS = {
    "YH": [f"G-{i}" for i in range(1, 43)],
    "LN": [f"G-{i}" for i in range(1, 57)],
    "YG": [f"G-{i}" for i in range(1, 85)] + [f"D-{i}" for i in range(1, 6)],
}


def check_coverage():
    """Every goal of every member model must be absorbed by exactly >=1 unified goal."""
    absorbed = {}
    for gid, t in TRACE.items():
        for m in t["merged"]:
            who, mid = m.split(" ", 1)
            absorbed.setdefault((who, mid), []).append(gid)
    missing = [(w, x) for w, ids in MEMBER_GOALS.items() for x in ids if (w, x) not in absorbed]
    return absorbed, missing


SPRINT_LINKS = [ConflictLink(NODES[a], NODES[b]) for k, (a, b, *_) in CONFLICTS.items()
                if k in ("CF-1", "CF-2", "CF-3")] + [
    ObstructionLink(g26, o1), ResolutionLink(g30, o1), ResolutionLink(g31, o1)]


def build(scope="full"):
    """scope='full': whole unified model; scope='sprint': only branches touched by the sprint."""
    if scope == "sprint":
        output = generate_graph([g02, g21, g82, g80], SPRINT_LINKS)
    else:
        output = generate_graph([g01], links)
    # U+1F5F2 (the package's lightning glyph) is missing from common fonts; U+26A1 renders everywhere
    output = output.replace('"#128498;"', '"#9889;"')
    return output


CONFIG = {"theme": "default", "themeVariables": {"fontFamily": "Tahoma"}}

if __name__ == "__main__":
    _, missing = check_coverage()
    if missing:
        print("UNMAPPED member goals:", missing)
    import sys
    scope = sys.argv[1] if len(sys.argv) > 1 else "full"     # python goal_model_unified.py sprint
    graph = build(scope)
    print(graph)
    print(generate_pako_link(graph, "edit", config=CONFIG))
