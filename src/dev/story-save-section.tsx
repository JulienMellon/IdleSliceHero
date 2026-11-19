// Card X4: the Story & save block of the Test panel: play the next story beat now, skip the tutorial, copy the save out, paste one in and reset the
// test save. Tap-only except the paste box; every button is 44 pt tall. The logic is in story-save.ts (pure TS, tested); this file wires the store in.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { NO_PREFS } from '../components/store/store-model';
import { gameClockOffset, gameNow, setGameClockOffset, setGameSpeed } from '../engine/clock';
import { setFreeBuys } from '../engine/game';
import { setTestBuyAnswer } from '../services/purchases.web';
import { useGame } from '../store/game-store';
import { TAP } from '../components/tap-targets';
import { C, F } from '../theme';
import type { JumpHost } from './jumps';
import {
  COPIED_MS,
  TEST_SAVE_KEY,
  copyText,
  exportSave,
  importSave,
  nextBeatNow,
  nextBeatReason,
  resetTestSave,
  skipTutorial,
  skipTutorialReason,
  type ResetHost,
} from './story-save';

/** The host over the real store: the game in memory, the test save slot, the test clock. */
const host: JumpHost = {
  storage: AsyncStorage,
  saveKey: TEST_SAVE_KEY,
  now: gameNow,
  current: () => useGame.getState().game,
  flush: () => useGame.getState().save(),
  set: (game) => useGame.getState().testSetGame(game),
};

const resetHost: ResetHost = {
  storage: AsyncStorage,
  saveKey: TEST_SAVE_KEY,
  flush: () => useGame.getState().save(),
  defaults: () => {
    setFreeBuys(true);
    setGameSpeed(1);
    setGameClockOffset(0);
    setTestBuyAnswer(null);
  },
  clockOffset: gameClockOffset,
  reload: () => globalThis.location?.reload(),
  newGame: async () => {
    useGame.setState({ prefs: NO_PREFS });
    await useGame.getState().resetGame();
  },
};

function Btn({ label, onPress, disabled, testID, tone }: { label: string; onPress: () => void; disabled?: boolean; testID: string; tone?: 'go' | 'danger' }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[styles.btn, tone === 'go' && styles.btnGo, tone === 'danger' && styles.btnDanger, disabled && styles.btnOff]}
    >
      <Text style={[styles.btnText, tone && styles.btnTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function StorySaveBody() {
  // primitives only: the reasons are strings, so a tick that changes nothing the rows say does not redraw them
  const beatReason = useGame((s) => nextBeatReason(s.game));
  const tutorialReason = useGame((s) => skipTutorialReason(s.game));
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState<string | null>(null);
  const [paste, setPaste] = useState('');
  const [importError, setImportError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (copiedTimer.current && clearTimeout(copiedTimer.current)), []);

  const playNext = () => {
    const r = nextBeatNow(useGame.getState().game);
    if (!r.ok) return setMessage(r.reason);
    useGame.getState().testSetGame(r.state);
    setMessage(r.kind === 'scene' ? `Next beat due: ${r.label}. Close the panel to watch it.` : `${r.label}: the rival challenge is on offer now`);
  };
  const skip = () => {
    useGame.getState().testSetGame(skipTutorial(useGame.getState().game));
    setMessage('Tutorial skipped');
  };
  const copy = async () => {
    setBusy(true);
    try {
      const text = await exportSave(host);
      const nav = (globalThis as { navigator?: { clipboard?: { writeText(t: string): Promise<void> } } }).navigator;
      if (await copyText(text, nav?.clipboard)) {
        setShown(null);
        setCopied(true);
        if (copiedTimer.current) clearTimeout(copiedTimer.current);
        copiedTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
      } else {
        setShown(text); // the clipboard refused: the save is in a box to select and copy by hand
        setMessage('The clipboard refused. Select the text below.');
      }
    } finally {
      setBusy(false);
    }
  };
  const doImport = async () => {
    setBusy(true);
    try {
      const r = await importSave(host, paste);
      if (!r.ok) return setImportError(r.error);
      setImportError('');
      setPaste('');
      setMessage('Imported. The old save is in the backup slot (Undo last jump).');
    } catch (e) {
      setImportError(`Failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };
  const doReset = async () => {
    setBusy(true);
    try {
      const r = await resetTestSave(resetHost);
      setConfirmReset(false);
      setMessage(r.reloaded ? 'Reset. Reloading to put the test clock at 0…' : 'Reset: a new game, free buys ON, 1×, clock offset 0');
    } catch (e) {
      setMessage(`Failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.col}>
      <Btn label="Play next story beat now" testID="test-next-beat" disabled={beatReason !== null || busy} onPress={playNext} />
      {beatReason !== null && <Text style={styles.caption}>{beatReason}</Text>}
      <Btn label="Skip tutorial" testID="test-skip-tutorial" disabled={tutorialReason !== null || busy} onPress={skip} />
      {tutorialReason !== null && <Text style={styles.caption}>{tutorialReason}</Text>}

      <Text style={styles.heading}>Save</Text>
      <Btn label={copied ? 'Copied' : 'Copy save'} testID="test-export" disabled={busy} onPress={() => void copy()} />
      {shown !== null && (
        <TextInput value={shown} multiline editable={false} selectTextOnFocus style={styles.box} testID="test-export-text" accessibilityLabel="Save text" />
      )}
      <TextInput
        value={paste}
        onChangeText={(t) => {
          setPaste(t);
          if (importError) setImportError('');
        }}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Paste a save here"
        placeholderTextColor="rgba(0,0,0,0.45)"
        style={styles.box}
        testID="test-import-text"
        accessibilityLabel="Paste a save"
      />
      <Btn label="Import" testID="test-import" disabled={busy || paste.trim() === ''} onPress={() => void doImport()} />
      {importError !== '' && (
        <Text style={styles.error} testID="test-import-error">
          {importError}
        </Text>
      )}
      <Text style={styles.caption}>Import backs up the current save first. A bad paste changes nothing.</Text>

      <Btn label="Reset test save" testID="test-reset" disabled={busy} onPress={() => setConfirmReset(true)} />
      {confirmReset && (
        <View style={styles.row}>
          <Btn label="Yes, reset" tone="danger" testID="test-reset-confirm" disabled={busy} onPress={() => void doReset()} />
          <Btn label="Cancel" testID="test-reset-cancel" onPress={() => setConfirmReset(false)} />
        </View>
      )}
      {message !== '' && (
        <Text style={styles.message} testID="test-story-message">
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  col: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  heading: { fontFamily: F.bold, color: C.ink, fontSize: 15, marginTop: 4 },
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
  btnDanger: { backgroundColor: '#B00020', borderColor: '#B00020' },
  btnOff: { opacity: 0.4 },
  btnText: { fontFamily: F.bold, color: C.ink, fontSize: 14, textAlign: 'center' },
  btnTextOn: { color: '#fff' },
  box: {
    minHeight: 96,
    maxHeight: 160,
    padding: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
    backgroundColor: '#fff',
    color: C.ink,
    fontFamily: F.bold,
    fontSize: 12,
    textAlignVertical: 'top',
  },
  message: { fontFamily: F.bold, color: C.ink, fontSize: 14 },
  error: { fontFamily: F.bold, color: '#B00020', fontSize: 13 },
  caption: { fontFamily: F.bold, color: C.ink, fontSize: 12, opacity: 0.7 },
});
