# Agrenor Tavern Werewolf - MVP Handoff Specification

Status: MVP architecture specification  
Target project: Project-Agrenor-Tactical-Card-Game  
Repository: https://github.com/ekkavish31/Project-Agrenor-Tactical-Card-Game

## 1. Goal

Build a full-architecture but MVP-content Werewolf/social-deduction minigame that can be launched from the tavern/bar in Agrenor.

The main design principle is that an Agrenor NPC has an existing identity/personality, then receives a hidden board-game role on top of that identity for each match.

Example:

`Luna personality + Werewolf role + Luna's private knowledge + current social context -> Luna's decisions`

NPCs must therefore not behave as generic Werewolf bots. The same NPC should remain recognizably the same character whether assigned Villager, Seer, Doctor, or Werewolf.

No LLM, AI API, server inference, or internet connection is required. NPC behavior is rule/scoring based with controlled randomness.

## 2. Repository Integration Assumptions

The repository uses `index.html` as the main game host and separates village/interior experiences into dedicated pages such as `village-town.html`, `village-place.html`, and `place-interior.html`. Game JavaScript belongs under `js/`, CSS under `css/`, assets under `assets/`, and tooling/tests under `tools/`.

Existing relevant areas include:

- `place-interior.html`
- `js/interior.js`
- `js/interior-art.js`
- `js/location-actions.js`
- existing village NPC identities/assets
- `js/asset-manifest.js`
- main game/world-state mechanisms
- Node/Playwright-style tooling under `tools/`

Do not tightly couple Werewolf rules to `interior.js`. The tavern/interior should only launch the minigame and receive its result.

## 3. Integration Boundary

Desired flow:

```text
Tavern / Bar
  -> interaction: Play Werewolf
  -> build Agrenor context
  -> launch Werewolf module
  -> isolated MatchState
  -> play complete match
  -> produce WerewolfResult
  -> return to Tavern
  -> optionally apply rewards/relationship effects to main game state
```

The Werewolf module must not freely mutate the main game/world state during a match.

Only read required Agrenor data at launch and commit approved result data after the match ends.

Proposed integration API:

```js
const result = await Werewolf.launch({
  playerId,
  participants,
  gmId,
  relationships,
  presetId,
  seed
});
```

Example result:

```js
{
  winner: "village",
  playerSurvived: true,
  coinsEarned: 0,
  relationshipChanges: [],
  revealedRumors: [],
  matchSummary: {}
}
```

MVP rewards may remain zero/empty. Do not make reward integration a blocker for gameplay.

## 4. Delivery Architecture

For MVP, isolate the minigame in its own page rather than adding a large overlay directly to the main host.

Proposed structure:

```text
werewolf-game.html

css/
  werewolf.css

js/
  werewolf/
    bootstrap.js
    engine.js
    match-state.js
    phase-controller.js
    event-bus.js

    roles/
      registry.js
      villager.js
      werewolf.js
      seer.js
      doctor.js

    social/
      personality.js
      knowledge.js
      belief.js
      memory.js
      intent.js
      decision.js

    dialogue/
      composer.js
      templates.js
      repetition.js

    npc/
      profiles.js
      npc-controller.js

    gm/
      bartender.js

    ui/
      screen.js
      discussion.js
      night.js
      vote.js

    integration/
      agrenor-adapter.js

tools/
  test-werewolf-rules.cjs
  simulate-werewolf.cjs
  e2e-werewolf.cjs
```

Names may be adjusted to existing repository conventions, but responsibilities must remain separated.

## 5. MVP Match Specification

### Participants

- 6 active players total
- 1 human player
- 5 NPC players
- 1 GM who is not a participant

Target match length: approximately 8-15 minutes.

NPC identities must come from existing Agrenor NPC data where possible. Do not create duplicate identities solely for this minigame.

The set of five NPCs must be selected through an adapter/configuration layer so participants can later be changed without modifying the engine.

### MVP Roles

Initial role set:

- Werewolf x1
- Seer x1
- Doctor x1
- Villager x3

Architecture must already support adding roles later without editing the central engine.

Target extension model:

```js
RoleRegistry.register({
  id: "seer",
  team: "village",
  nightAction: ..., 
  knowledgeRule: ...,
  winCondition: ...
});
```

Later examples include Hunter, Witch, Bodyguard, additional Werewolves, custom Agrenor roles, and alternative presets.

## 6. Match Loop

```text
LOBBY
  -> ROLE_REVEAL
  -> NIGHT
      -> Werewolf action
      -> Seer action
      -> Doctor action
  -> DAWN
  -> DISCUSSION
  -> VOTE
  -> RESOLUTION
  -> WIN_CHECK
      -> if no winner: NIGHT
      -> if winner: RESULT
```

The phase controller is authoritative for legal actions and phase transitions.

Do not allow UI components or NPC controllers to change phases directly.

## 7. True State vs Private Knowledge

This is a critical architectural requirement.

The engine/GM may know the true match state:

```text
Bram = Werewolf
Luna = Seer
Orla = Villager
...
```

NPC decision code must never receive unrestricted true state.

NPC decision input must instead resemble:

```js
NPCBrain.decide({
  participantView,
  privateKnowledge,
  beliefs,
  memory,
  publicEvents,
  currentConversation
});
```

An NPC who was asleep during a night action must not receive that information.

A Villager must not know who the Werewolf is merely because the engine knows.

A Seer knows only the identities/results actually inspected.

A Werewolf knows information granted by the Werewolf role/preset.

The human player is subject to exactly the same information rules.

Add automated tests specifically designed to detect accidental hidden-information leakage.

## 8. Night Privacy

The GM controls night presentation.

### Human is Villager

The screen should obscure private activity. Conceptually:

```text
GM: Everyone close your eyes.
[screen darkens / tavern ambience]
[hidden NPC night actions execute]
GM: Everyone open your eyes.
```

Do not animate or expose which NPC woke up.

### Human is Werewolf

Reveal only information appropriate to Werewolves and provide the Werewolf night target/action UI.

### Human is Seer

Allow selection of one legal target and privately reveal the inspection result.

### Human is Doctor

Allow selection of one legal protection target but do not reveal the Werewolf's target.

NPCs who did not wake for a particular action do not receive that event in their private knowledge.

## 9. GM

MVP GM: Bartender.

The GM:

- does not participate in voting
- has no hidden role
- controls phase announcements/presentation
- may access true match state when required to resolve the game
- must never leak hidden information through dialogue/UI

Design GM through a registry/data layer so a waitress or other characters can replace the Bartender later without changing game rules.

## 10. NPC Personality Model

Personality is independent of board-game role.

Initial personality schema should support at least:

```js
{
  aggression: 0.0,
  honesty: 0.0,
  confidence: 0.0,
  suspiciousness: 0.0,
  riskTaking: 0.0,
  talkativeness: 0.0,
  stubbornness: 0.0,
  empathy: 0.0
}
```

Values are normalized 0-1.

More traits can be added later without breaking saved match logs/state.

Do not use personality as a simple fixed action mapping. Personality modifies action scores under context.

Example concept:

```text
NPC identity
+ personality
+ relationships
+ assigned game role
+ private knowledge
+ beliefs
+ memory
+ current conversation
+ controlled random variation
= action scoring
```

The same character should behave differently across different roles while still retaining recognizable tendencies.

## 11. Belief Model

Each NPC owns its own beliefs about the other active participants.

MVP belief state per target:

```js
{
  suspicion: 0.0,
  trust: 0.0,
  credibility: 0.0,
  certainty: 0.0,
  threat: 0.0
}
```

Do not collapse everything into `suspicion`.

Beliefs are updated from public events, private role information, relationships, claims, contradictions, votes, and personality-dependent interpretation.

Different NPCs must be allowed to interpret the same public event differently.

## 12. Memory/Event Model

Store semantic events, not merely dialogue strings.

Example:

```js
{
  id: "evt-123",
  type: "ACCUSATION",
  actor: "bram",
  target: "luna",
  reason: "changed_vote",
  day: 2,
  public: true
}
```

Other useful events include:

- ACCUSATION
- DEFENSE
- QUESTION
- ANSWER
- ROLE_CLAIM
- ROLE_COUNTERCLAIM
- VOTE
- VOTE_CHANGE
- CONTRADICTION
- SILENCE
- AGREEMENT
- DISAGREEMENT
- NIGHT_RESULT, private where appropriate
- DEATH
- SAVED_PLAYER, only publicly known if ruleset explicitly reveals it

Memory allows later references such as "You accused me yesterday" without hard-coding full conversation branches.

## 13. Player Day Actions

MVP human actions:

- QUESTION
- ACCUSE
- DEFEND
- AGREE
- DISAGREE
- ASK_REASON
- CLAIM_ROLE
- REVEAL_INFORMATION
- PRESSURE
- STAY_SILENT
- VOTE

`CLAIM_ROLE` must not require the claim to be truthful.

Players must be able to bluff.

The UI should make legal targets/context clear but should not tell the player whether a statement is tactically correct.

## 14. NPC Intents

NPCs operate using semantic intents rather than fixed scripts.

MVP intents should cover at least:

- QUESTION
- ANSWER
- ACCUSE
- DEFEND_SELF
- DEFEND_OTHER
- AGREE
- DISAGREE
- ASK_REASON
- COUNTER_ACCUSE
- DEFLECT
- CLAIM_ROLE
- FAKE_CLAIM
- REVEAL_INFORMATION
- HIDE_INFORMATION
- PRESSURE
- CHANGE_VOTE
- STAY_SILENT

Additional social intents can be added later without modifying the core rule engine.

## 15. NPC Decision Model

No LLM is used.

For each legal intent/action, calculate a score using contextual factors.

Conceptually:

```text
score(action) =
  personality influences
+ role strategy influences
+ belief influences
+ relationship influences
+ memory/evidence relevance
+ self-preservation
+ team objective
+ conversation pressure
+ bounded random noise
- repetition/cooldown penalties
```

Then choose among high-scoring legal actions using weighted randomness rather than always choosing the exact maximum.

Requirements:

- seeded RNG for reproducible tests
- invalid/illegal actions score out entirely
- NPCs must sometimes make imperfect decisions
- difficulty tuning should adjust reasoning/noise rather than grant hidden information
- no NPC may access facts absent from its knowledge view

## 16. Dialogue System

Dialogue is generated from authored templates plus semantic context, not from an AI API.

Pipeline:

```text
Intent
+ Speaker
+ Personality
+ Tone/Emotion
+ Target
+ Evidence
+ Relevant Memory
+ Relationship
-> Dialogue Composer
-> final line
```

Example semantic action:

```text
ACCUSE(Bram, evidence = changed_vote)
```

Possible presentations:

Calm:
"Bram changed his vote at the end. I don't trust that yet."

Aggressive:
"Bram, you switched the second pressure hit you. Explain that."

Uncertain:
"I'm not sure, but Bram changing his vote bothers me."

The exact English/Thai copy is content and may evolve; the semantic system is the important part.

## 17. Dialogue Anti-Repetition

The system must actively prevent robotic repetition.

Implement:

- recently-used template history
- large penalty for immediately repeated templates
- intent repetition penalty
- repeated-evidence diminishing relevance
- speaker cooldown
- response priority for directly accused/questioned NPCs
- optional acknowledgement when a topic has already been exhausted

Example behavior:

If `changed_vote` has been discussed several times, NPCs should become less likely to independently repeat it unless new evidence makes it relevant again.

## 18. Conversation Controller

Discussion should feel like a small social sequence rather than every NPC independently dumping one sentence.

Conceptual loop:

```text
Select speaker
  -> select intent
  -> perform semantic action
  -> generate dialogue
  -> create social event
  -> offer response opportunity
      -> targeted NPC response
      -> another NPC reacts
      -> human response window
      -> no response
  -> update memories/beliefs
  -> continue or end discussion round
```

Use bounded conversation length so matches remain playable.

MVP target: approximately 2-3 meaningful human action opportunities per day, with NPC reactions around them. Exact pacing may be tuned through playtests.

## 19. NPC Content Extensibility

Adding another NPC later should primarily require content/data, not engine changes.

Desired profile shape:

```js
{
  npcId: "luna",
  personality: {...},
  socialStyle: {...},
  dialogueTags: [...],
  tells: {...},
  relationships: "from Agrenor adapter"
}
```

The adapter should obtain name/portrait/assets from existing Agrenor identity/asset sources where possible.

Do not duplicate canonical NPC names, portraits, or general identity data in the Werewolf system unless technically unavoidable.

## 20. Role Extensibility

Adding a new role should normally require:

1. new role definition/module
2. optional night action implementation
3. knowledge rule
4. team/win metadata
5. dialogue presentation content if necessary
6. registration in a role preset

It should not require editing `engine.js` switch statements for every new role.

Prefer registry/hooks/capabilities over hard-coded role-name branching.

## 21. Presets

Although MVP ships one primary setup, support preset data early.

Example:

```js
{
  id: "classic_beginner",
  playerCount: 6,
  roles: [
    "werewolf",
    "seer",
    "doctor",
    "villager",
    "villager",
    "villager"
  ]
}
```

Later presets may alter player count, roles, reveal rules, discussion length, or role interactions.

## 22. Match State

Keep all transient game state under an isolated `MatchState`.

It should contain at least:

```text
match id / seed
phase / day number
participants
assigned roles
alive/dead state
true role state
night selections
public event log
private event/knowledge stores
belief tables
conversation state
vote state
winner/result
RNG state if necessary
```

UI state should not become the authoritative match state.

## 23. Determinism and Debugging

Use seeded randomness.

Every match should have a seed that allows reproduction of NPC decisions for debugging.

Provide a developer/debug mode able to inspect true state and per-NPC knowledge, but this must be impossible to expose accidentally in normal gameplay.

Ideal debug output:

```text
Seed: abc123
Day: 2
Phase: DISCUSSION

TRUE:
Bram: Werewolf
Luna: Seer

Luna knows:
Bram inspected -> Werewolf

Orla beliefs:
Bram suspicion .68
Luna suspicion .31
```

## 24. UI MVP

Do not over-invest in polished art before the social simulation works.

Required screens:

1. Lobby/participants
2. Private role reveal
3. Night/private action screen
4. Dawn/result announcement
5. Discussion screen
6. Vote screen
7. Elimination/resolution
8. Match result

The discussion screen must clearly show:

- portrait/name of current speaker
- dialogue
- active/alive participants
- available player actions
- target selection when applicable
- public claims/evidence where useful
- no hidden state leakage

Reuse existing Agrenor portraits/assets where practical.

## 25. Tavern Connection for MVP

The tavern integration only needs to prove the complete round trip:

```text
Tavern interaction
-> launch Werewolf
-> complete/cancel match
-> return safely to Tavern
```

Participant selection can initially use a configured eligible NPC list supplied by the adapter.

Later it can depend on:

- which NPCs are physically present
- time/day
- relationship level
- quests
- NPC schedules
- story state

Those features are deliberately not MVP blockers.

## 26. Main-Game Effects

Keep MVP effects minimal.

The engine should nevertheless return structured semantic results so later systems can use them.

Possible later effects:

- gold wagers
- relationship changes
- rumors
- quest clues
- achievement/stat tracking
- NPC match history
- reactions to repeated bluffing

Do not implement deep persistent social consequences until the base minigame is stable.

## 27. Testing Requirements

Create at least:

```text
tools/test-werewolf-rules.cjs
tools/simulate-werewolf.cjs
tools/e2e-werewolf.cjs
```

### Unit/rules tests

Cover:

- correct role counts
- legal/illegal night actions
- phase transitions
- death/elimination
- Doctor protection resolution
- Seer inspection knowledge
- Werewolf kill resolution
- voting rules
- ties if supported
- village win condition
- werewolf win condition
- dead players cannot perform living-player actions
- GM never becomes participant

### Hidden-information tests

Must explicitly validate:

- Villager does not receive night actor identities
- Doctor does not see Werewolf target before resolution
- Seer receives only its own inspection result
- unrelated NPCs do not receive private Seer result
- NPC decision function cannot access unrestricted `MatchState`
- debug state is disabled outside debug mode

### Simulation

Run at least 10,000 seeded automated matches before considering core rules stable.

Check for:

- hangs/deadlocks
- phases that cannot complete
- missing legal actions
- crashes
- impossible role state
- invalid survivors
- winner not resolving
- extreme strategy dominance

Do not treat win-rate balance from random/basic bots as final game balance. The simulation is primarily a correctness/stability test during MVP.

### E2E

Automate at least one full browser match path and verify:

- game launches
- role reveal works
- night screen respects player role
- discussion accepts player action
- vote completes
- match reaches result
- return/exit works
- no uncaught page errors

## 28. Performance

This feature is primarily state, decision logic, and text. It should not require heavy runtime resources.

Requirements:

- do not run continuous social simulation while minigame is inactive
- load Werewolf page/module/assets only when needed
- no requirement for Web Worker during MVP
- profile before adding worker complexity
- clean timers/listeners/UI state on exit

## 29. Non-Goals for MVP

Do not block MVP on:

- online multiplayer
- LLM-generated dialogue
- AI API integration
- voice acting
- dozens of NPCs
- dozens of roles
- persistent tournament system
- sophisticated betting economy
- large reward/quest integration
- perfect final animation/art
- cross-match psychological learning

Architecture may leave extension points for these but should not implement them prematurely.

## 30. Definition of Done

MVP is complete when all of the following are true:

1. Human can finish a complete match from launch to result.
2. Human can be assigned any of the four MVP roles.
3. Six-player setup works with five NPCs.
4. Night phases never expose information the human role should not know.
5. NPCs never access hidden information absent from their own knowledge.
6. NPCs can question, accuse, defend, answer, agree/disagree, claim/bluff, stay silent, and vote through the semantic intent system.
7. NPC decisions reflect both personality and assigned game role.
8. Each NPC maintains independent beliefs and memory.
9. Dialogue is generated from semantic context/templates rather than fixed scenario trees.
10. Repetition control prevents obvious immediate looping.
11. Match outcome correctly resolves Village or Werewolf victory.
12. Seeded matches are reproducible for debugging.
13. At least 10,000 headless simulated matches complete without deadlock/crash.
14. At least one browser E2E full-match flow passes.
15. Tavern can launch the minigame and safely receive/ignore its result.
16. Adding a normal NPC does not require editing the core engine.
17. Adding a normal new role does not require rewriting the core engine.

## 31. Implementation Order

Implement in this sequence.

### Phase 1 - Rules Kernel

Build:

- MatchState
- seeded RNG
- participant model
- role registry
- four MVP roles
- phase controller
- night actions
- voting
- win conditions

Use CLI/headless tests before sophisticated UI.

### Phase 2 - Knowledge Isolation

Build:

- per-participant knowledge view
- private/public events
- knowledge tests
- debug inspector

Do not proceed to social AI until hidden-information tests pass.

### Phase 3 - Beliefs and Memory

Build:

- semantic event log
- per-NPC beliefs
- memory relevance
- relationship input adapter

### Phase 4 - NPC Decision AI

Build:

- legal intent generation
- action scoring
- personality modifiers
- role strategy modifiers
- weighted choice
- deterministic seeded execution

### Phase 5 - Conversation

Build:

- conversation controller
- intents/responses
- player action windows
- accusation/question response priority
- semantic social events

### Phase 6 - Dialogue Composer

Build:

- template registry
- tone/style variants
- evidence/memory interpolation
- signature NPC lines
- anti-repetition

### Phase 7 - UI

Build all MVP screens and night privacy presentation.

### Phase 8 - Agrenor Integration

Build:

- tavern launcher
- existing NPC/asset adapter
- result bridge
- safe return to tavern

### Phase 9 - Simulation / Polish

Run large simulations, E2E, tune pacing, tune dialogue diversity, then add production art/audio polish.

## 32. Coding-Agent Instructions

When implementing this specification:

1. Inspect existing repository conventions before creating files.
2. Reuse existing NPC identity and asset systems rather than duplicating canonical character data.
3. Keep Werewolf transient state isolated from global/main game state.
4. Do not give NPC decision code access to true match state.
5. Do not implement role logic with one giant switch statement.
6. Do not implement dialogue as one giant scenario tree.
7. Use seeded randomness.
8. Add tests concurrently with each phase.
9. Keep module APIs explicit and small.
10. Prefer data-driven registries for NPCs, roles, templates, and presets.
11. Do not introduce React/Phaser/large dependencies unless the existing repository already depends on them and there is a demonstrated need.
12. Preserve the existing game and tavern behavior outside the new entry point.
13. Do not refactor unrelated systems during MVP implementation.
14. After each phase, run relevant repository tests plus new Werewolf tests.

## 33. First Coding Task

The first implementation task should NOT be the full UI.

Create a headless playable rules kernel capable of running this:

```text
create match with seed
-> assign six roles
-> reveal only each participant's legal private information
-> execute all night actions
-> resolve dawn
-> accept discussion placeholders/events
-> accept votes
-> eliminate player
-> repeat
-> return winner
```

Then add automated tests proving hidden-information isolation.

Only after that foundation passes should the coding agent build NPC social behavior/dialogue/UI.

## 34. Product Direction After MVP

The long-term target is a reusable Agrenor social simulation, not merely a one-off Werewolf script.

Future systems should be able to reuse parts of:

```text
Personality
+ Relationship
+ Knowledge
+ Belief
+ Memory
+ Intent
+ Dialogue Composer
```

Possible later uses include tavern gossip, companion banter, arguments between NPCs, interrogation, negotiation, quest reactions, and other social board/card games such as Coup.

However, keep the MVP implementation centered on Werewolf so the abstraction is proven by a real playable system before generalizing it across the main game.
