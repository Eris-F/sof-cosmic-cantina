/**
 * Skill tree scene handler.
 *
 * Touch zones imported from zones/skilltree.
 *
 * @module scenes/SkillTreeScene
 */
import { SCENE_EVENT } from '../core/SceneMachine';
import { SKILL_BRANCHES } from '../config/skills';
import { TAP } from '../input/Actions';
import { zoneHit } from '../zones/Zone';
import { branchRow, upgradeButton, BACK_BTN, BRANCH_COUNT } from '../zones/skilltree';
import type { IEventBus } from '../types/index';
import type { GameStore } from '../types/systems';
import type { GameState } from '../types/state';
import type { SceneHandler, SceneActions } from './SceneManager';
import type { Draft } from 'immer';

interface SkillActions {
  upgrade(branchId: string): { success: boolean; reason?: string; newLevel?: number };
}

export function createSkillTreeScene(skillActions?: SkillActions): SceneHandler {
  let enteredThisFrame = false;
  let actions: SkillActions | null = skillActions ?? null;

  return {
    enter(_store: unknown, _bus: IEventBus, svc?: unknown): void {
      enteredThisFrame = true;
      if (svc && typeof svc === 'object' && 'upgrade' in svc) {
        actions = svc as SkillActions;
      }
    },

    update(_dt: number, sceneActions: SceneActions, store: unknown, bus: IEventBus): void {
      if (enteredThisFrame) { enteredThisFrame = false; return; }

      const { consumeKey } = sceneActions;
      const gameStore = store as GameStore;
      const skillState = gameStore.getState().ui.skillTree;

      // Flash timer decay
      if (skillState.flashTimer > 0) {
        gameStore.update((draft: Draft<GameState>) => {
          draft.ui.skillTree.flashTimer = Math.max(0, draft.ui.skillTree.flashTimer - 0.016);
          if (draft.ui.skillTree.flashTimer <= 0) draft.ui.skillTree.flashMessage = null;
        });
      }

      // ── Exit ──────────────────────────────────────────────────────────
      if (consumeKey('Escape')) { bus.emit(SCENE_EVENT.CLOSE_SKILLS); return; }

      // ── Touch input ───────────────────────────────────────────────────
      const tap = sceneActions._pressed.find(a => a.type === TAP);
      if (tap && tap.payload) {
        const { x, y } = tap.payload as { x: number; y: number };

        // Back button
        if (zoneHit(BACK_BTN, x, y)) { bus.emit(SCENE_EVENT.CLOSE_SKILLS); return; }

        // Upgrade button of selected branch
        if (zoneHit(upgradeButton(skillState.selectedBranch), x, y)) {
          performUpgrade(gameStore, actions, skillState.selectedBranch);
          return;
        }

        // Branch selection
        for (let i = 0; i < BRANCH_COUNT; i++) {
          if (zoneHit(branchRow(i), x, y)) {
            if (i === skillState.selectedBranch) {
              performUpgrade(gameStore, actions, i);
            } else {
              gameStore.update((draft: Draft<GameState>) => {
                draft.ui.skillTree.selectedBranch = i;
              });
            }
            return;
          }
        }
      }

      // ── Keyboard navigation ───────────────────────────────────────────
      if (consumeKey('KeyW') || consumeKey('ArrowUp')) {
        gameStore.update((draft: Draft<GameState>) => {
          draft.ui.skillTree.selectedBranch = (draft.ui.skillTree.selectedBranch - 1 + BRANCH_COUNT) % BRANCH_COUNT;
        });
      }
      if (consumeKey('KeyS') || consumeKey('ArrowDown')) {
        gameStore.update((draft: Draft<GameState>) => {
          draft.ui.skillTree.selectedBranch = (draft.ui.skillTree.selectedBranch + 1) % BRANCH_COUNT;
        });
      }
      if (consumeKey('Enter') || consumeKey('Space')) {
        performUpgrade(gameStore, actions, skillState.selectedBranch);
      }
    },

    exit(_store: unknown, _bus: IEventBus): void {},
  };
}

function performUpgrade(store: GameStore, actions: SkillActions | null, branchIndex: number): void {
  if (!actions) return;
  const branch = SKILL_BRANCHES[branchIndex];
  if (!branch) return;
  const result = actions.upgrade(branch.id);
  if (result.success) {
    showFlash(store, `${branch.name} LV${result.newLevel}!`);
  } else {
    showFlash(store, result.reason === 'insufficient_funds' ? 'NOT ENOUGH COINS' : 'ALREADY MAXED');
  }
}

function showFlash(store: GameStore, message: string): void {
  store.update((draft: Draft<GameState>) => {
    draft.ui.skillTree.flashMessage = message;
    draft.ui.skillTree.flashTimer = 1.5;
  });
}
