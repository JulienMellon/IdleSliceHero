// Card X2: the Money and Time rows of the Test panel. Tap-only; every row is 44 pt tall. The actions are in money.ts and time.ts (pure TS, tested).
import { useReducer, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { gameClockOffset, gameSpeed } from '../engine/clock';
import { freeBuysOn } from '../engine/game';
import { testBuyAnswerOn } from '../services/purchases.web';
import { TAP } from '../components/tap-targets';
import { C, F } from '../theme';
import { addDiamonds, addIncome, cashToZero, DIAMONDS_GIVEN, INCOME_ROWS, toggleFreeBuys, toggleStoreSucceeds } from './money';
import { AWAY_ROWS, awayFor, awayToNextDay, awayToNextMonday, clockReadout, FORWARD_ROWS, playForward, setSpeed, SPEEDS } from './time';

function Btn({ label, onPress, on, disabled, testID }: { label: string; onPress: () => void; on?: boolean; disabled?: boolean; testID: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: on, disabled }}
      style={[styles.btn, on && styles.btnOn, disabled && styles.btnOff]}
    >
      <Text style={[styles.btnText, on && styles.btnTextOn]}>{label}</Text>
    </Pressable>
  );
}

function Toggle({ label, on, onChange, testID }: { label: string; on: boolean; onChange: (on: boolean) => void; testID: string }) {
  return (
    <Pressable onPress={() => onChange(!on)} testID={testID} accessibilityRole="switch" accessibilityState={{ checked: on }} style={styles.toggle}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.pill, on && styles.pillOn]}>
        <Text style={[styles.pillText, on && styles.btnTextOn]}>{on ? 'ON' : 'OFF'}</Text>
      </View>
    </Pressable>
  );
}

export function MoneyBody() {
  const [freeBuys, setFree] = useState(freeBuysOn);
  const [storeOk, setStoreOk] = useState(testBuyAnswerOn);
  return (
    <View style={styles.col}>
      <Toggle
        label="Free buys"
        on={freeBuys}
        testID="test-free-buys"
        onChange={(on) => {
          toggleFreeBuys(on);
          setFree(freeBuysOn());
        }}
      />
      <View style={styles.row}>
        {INCOME_ROWS.map((r) => (
          <Btn key={r.label} label={r.label} testID={`test-income-${r.seconds}`} onPress={() => addIncome(r.seconds)} />
        ))}
      </View>
      <View style={styles.row}>
        <Btn label="Cash → $0" testID="test-cash-zero" onPress={cashToZero} />
        <Btn label={`Diamonds +${DIAMONDS_GIVEN}`} testID="test-diamonds" onPress={() => addDiamonds()} />
      </View>
      <Toggle
        label="Store purchases succeed"
        on={storeOk}
        testID="test-store-ok"
        onChange={(on) => {
          toggleStoreSucceeds(on);
          setStoreOk(testBuyAnswerOn());
        }}
      />
    </View>
  );
}

export function TimeBody() {
  const [, redraw] = useReducer((n: number) => n + 1, 0);
  const [busy, setBusy] = useState(false);
  /** Run a time move, greying the rows until it is done. */
  const run = (move: () => Promise<boolean>) => {
    setBusy(true);
    void move().finally(() => {
      setBusy(false);
      redraw();
    });
  };
  return (
    <View style={styles.col}>
      <Text style={styles.readout} testID="test-clock-readout">
        {clockReadout(gameClockOffset())}
      </Text>
      <Text style={styles.caption}>Away for</Text>
      <View style={styles.rowWrap}>
        {AWAY_ROWS.map((r) => (
          <Btn key={r.label} label={r.label} testID={`test-away-${r.label.replace(' ', '')}`} disabled={busy} onPress={() => run(() => awayFor(r.ms))} />
        ))}
      </View>
      <View style={styles.row}>
        <Btn label="Next day" testID="test-next-day" disabled={busy} onPress={() => run(awayToNextDay)} />
        <Btn label="Next Monday" testID="test-next-monday" disabled={busy} onPress={() => run(awayToNextMonday)} />
      </View>
      <Text style={styles.caption}>Play forward</Text>
      <View style={styles.row}>
        {FORWARD_ROWS.map((r) => (
          <Btn key={r.label} label={r.label} testID={`test-forward-${r.seconds}`} disabled={busy} onPress={() => run(() => playForward(r.seconds))} />
        ))}
      </View>
      <Text style={styles.caption}>Game speed</Text>
      <View style={styles.row}>
        {SPEEDS.map((x) => (
          <Btn
            key={x}
            label={`${x}×`}
            testID={`test-speed-${x}`}
            on={gameSpeed() === x}
            onPress={() => {
              setSpeed(x);
              redraw();
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  col: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  btnOn: { backgroundColor: C.ink, borderColor: C.ink },
  btnOff: { opacity: 0.4 },
  btnText: { fontFamily: F.bold, color: C.ink, fontSize: 14 },
  btnTextOn: { color: '#fff' },
  toggle: { minHeight: TAP.min, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  label: { flex: 1, fontFamily: F.bold, color: C.ink, fontSize: 14 },
  pill: { minWidth: 56, minHeight: 32, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: '#1B7F3B', borderColor: '#1B7F3B' },
  pillText: { fontFamily: F.bold, color: C.ink, fontSize: 13 },
  readout: { fontFamily: F.bold, color: '#B00020', fontSize: 15 },
  caption: { fontFamily: F.bold, color: C.ink, fontSize: 12, opacity: 0.7 },
});
