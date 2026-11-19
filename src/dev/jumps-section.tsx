// Card X3: the Neighbourhoods block of the Test panel: jump to any neighbourhood of any city "just built" (or the city complete), undo the last jump,
// and build the next shop now. Tap-only; every row is 44 pt tall. The logic is in jumps.ts (pure TS, tested); this file only wires the store and storage in.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { gameNow } from '../engine/clock';
import { useGame } from '../store/game-store';
import { TAP } from '../components/tap-targets';
import { C, F } from '../theme';
import { BACKUP_KEY, TEST_SAVE_KEY, buildNextNow, groupByCity, hasBackup, jumpTo, snapshotFile, undoJump, type JumpHost, type SnapshotRow } from './jumps';

/** The jump host over the real store: the game in memory, the test save slot, the test clock. */
const host: JumpHost = {
  storage: AsyncStorage,
  saveKey: TEST_SAVE_KEY,
  now: gameNow,
  current: () => useGame.getState().game,
  flush: () => useGame.getState().save(),
  // the popups and the scene of the game that was left do not follow the player to the new one
  set: (game) => useGame.setState({ game, offline: null, playing: null, lastSceneEndPlay: null, claimed: null }),
};

const rowId = (r: SnapshotRow) => `test-jump-${r.city}-${r.state.cityComplete ? 'complete' : r.hood}`;

function Btn({ label, onPress, disabled, testID, tone }: { label: string; onPress: () => void; disabled?: boolean; testID: string; tone?: 'go' }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[styles.btn, tone === 'go' && styles.btnGo, disabled && styles.btnOff]}
    >
      <Text style={[styles.btnText, tone === 'go' && styles.btnTextGo]}>{label}</Text>
    </Pressable>
  );
}

export function JumpsBody() {
  const [groups] = useState(() => groupByCity(snapshotFile().rows));
  const [pending, setPending] = useState<string | null>(null);
  const [undoable, setUndoable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void hasBackup(AsyncStorage).then(setUndoable);
  }, []);

  /** Run one async move with the rows greyed until it ends, then re-read the backup slot. */
  const run = async (move: () => Promise<string>) => {
    setBusy(true);
    try {
      setMessage(await move());
    } catch (e) {
      setMessage(`Failed: ${(e as Error).message}`);
    } finally {
      setPending(null);
      setUndoable(await hasBackup(AsyncStorage).catch(() => false));
      setBusy(false);
    }
  };
  const jump = (row: SnapshotRow) =>
    run(async () => {
      await jumpTo(host, row);
      return `Jumped to ${row.label}`;
    });
  const undo = () =>
    run(async () => {
      const r = await undoJump(host);
      return r.ok ? 'Undid the last jump' : r.reason;
    });
  const buildNext = () =>
    run(async () => {
      const r = buildNextNow(useGame.getState().game);
      if (!r.ok) return r.reason;
      useGame.setState({ game: r.state });
      await useGame.getState().save();
      return 'Built the next shop';
    });

  return (
    <View style={styles.col}>
      {groups.map((g) => (
        <View key={g.city} style={styles.col} testID={`test-jumps-${g.city}`}>
          <Text style={styles.city}>{g.name}</Text>
          {g.rows.map((r) => {
            const id = rowId(r);
            const open = pending === id;
            return (
              <View key={id} style={styles.col}>
                <Pressable
                  onPress={() => setPending(open ? null : id)}
                  disabled={busy}
                  testID={id}
                  accessibilityRole="button"
                  accessibilityLabel={`Jump to ${r.label}`}
                  accessibilityState={{ expanded: open, disabled: busy }}
                  style={[styles.jump, open && styles.jumpOpen, busy && styles.btnOff]}
                >
                  <Text style={styles.label}>{r.label}</Text>
                </Pressable>
                {open && (
                  <View style={styles.row}>
                    <Btn label="Jump here" tone="go" testID={`${id}-confirm`} disabled={busy} onPress={() => void jump(r)} />
                    <Btn label="Cancel" testID={`${id}-cancel`} onPress={() => setPending(null)} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
      <Btn label="Undo last jump" testID="test-jump-undo" disabled={busy || !undoable} onPress={() => void undo()} />
      <Btn label="Build next shop now (ignore story lock)" testID="test-build-next" disabled={busy} onPress={() => void buildNext()} />
      <Text style={styles.caption}>may break story order</Text>
      {message !== '' && (
        <Text style={styles.message} testID="test-jumps-message">
          {message}
        </Text>
      )}
      <Text style={styles.caption}>A jump saves the current game to {BACKUP_KEY.replace('slice-empire/save/', '')} first. One undo.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  col: { gap: 6 },
  row: { flexDirection: 'row', gap: 8 },
  city: { fontFamily: F.bold, color: C.ink, fontSize: 15, marginTop: 4 },
  jump: {
    minHeight: TAP.min,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  jumpOpen: { borderColor: C.ink },
  label: { fontFamily: F.bold, color: C.ink, fontSize: 14 },
  btn: {
    minHeight: TAP.min,
    minWidth: 64,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGo: { backgroundColor: C.ink, borderColor: C.ink },
  btnOff: { opacity: 0.4 },
  btnText: { fontFamily: F.bold, color: C.ink, fontSize: 14, textAlign: 'center' },
  btnTextGo: { color: '#fff' },
  message: { fontFamily: F.bold, color: '#B00020', fontSize: 14 },
  caption: { fontFamily: F.bold, color: C.ink, fontSize: 12, opacity: 0.7 },
});
