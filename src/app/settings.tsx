import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAudioPrefs } from '@/audio/prefs';
import { BuyButton } from '@/components/game-ui';
import { BUTTON_H, TAP } from '@/components/tap-targets';
import { APP_VERSION } from '@/content/version';
import { copyText } from '@/components/store/copy-text';
import { PRIVACY_URL, SUPPORT_URL } from '@/components/store/links';
import { analyticsNote, analyticsSwitchText, copyLine, INSTALL_ID_NOTE, installIdText, RESTORING, restoreResult } from '@/components/store/settings-model';
import { money } from '@/engine/format';
import { analytics, purchases } from '@/services';
import { privacy } from '@/services/runtime';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const game = useGame((s) => s.game);
  const resetGame = useGame((s) => s.resetGame);
  const [confirm, setConfirm] = useState(false);
  const music = useAudioPrefs((s) => s.music);
  const sound = useAudioPrefs((s) => s.sound);
  // the opt-out is saved by the privacy service; the switch shows what it holds now
  const [shareOn, setShareOn] = useState(() => !privacy.isOptedOut());
  const [installId] = useState(() => installIdText(analytics.installId()));
  const [copied, setCopied] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restored, setRestored] = useState('');
  const toggleShare = () => {
    const on = !shareOn;
    setShareOn(on);
    analytics.setOptOut(!on);
  };
  const copyId = () => {
    const id = analytics.installId();
    if (!id) setCopied('The ID isn’t ready yet. Try again in a moment.');
    else void copyText(id).then((r) => setCopied(copyLine(r)));
  };
  const restore = () => {
    if (restoring) return;
    setRestoring(true);
    setRestored(RESTORING);
    void purchases.restore().then((ids) => {
      useGame.getState().syncPlus();
      setRestored(restoreResult(ids));
      setRestoring(false);
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} testID="back">
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 70 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: insets.bottom + 24 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stats</Text>
          <Text style={styles.stat}>Lifetime earnings: {money(game.totalEarned)}</Text>
          <Text style={styles.stat}>Pizzas sold: {Math.floor(Object.values(game.shops).reduce((a, s) => a + s.sold, 0)).toLocaleString()}</Text>
          <Text style={styles.stat}>Story scenes seen: {game.seenScenes.length}/24</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Audio</Text>
          <Text style={styles.stat}>Follows your ring/silent switch.</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <Toggle label="Music" on={music} onPress={() => useAudioPrefs.getState().setMusic(!music)} testID="toggle-music" />
            <Toggle label="Sound" on={sound} onPress={() => useAudioPrefs.getState().setSound(!sound)} testID="toggle-sound" />
          </View>
        </View>
        <View style={styles.card} testID="settings-privacy">
          <Text style={styles.cardTitle}>Privacy and help</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <LinkButton label="Privacy Policy" url={PRIVACY_URL} testID="open-privacy" />
            <LinkButton label="Support" url={SUPPORT_URL} testID="open-support" />
          </View>
          <View style={{ marginTop: 12 }}>
            <Toggle label={analyticsSwitchText(shareOn)} on={shareOn} onPress={toggleShare} testID="toggle-analytics" whole />
          </View>
          <Text style={[styles.stat, { marginTop: 8 }]} testID="analytics-note">
            {analyticsNote(shareOn)}
          </Text>
        </View>
        <View style={styles.card} testID="settings-install">
          <Text style={styles.cardTitle}>Install ID</Text>
          <Text style={styles.stat}>{INSTALL_ID_NOTE}</Text>
          <Text selectable style={styles.idText} testID="install-id">
            {installId}
          </Text>
          <Pressable testID="copy-install-id" accessibilityRole="button" accessibilityLabel="Copy the Install ID" onPress={copyId} style={styles.action}>
            <Text style={styles.actionText}>Copy</Text>
          </Pressable>
          {copied !== '' && (
            <Text style={[styles.stat, { marginTop: 6 }]} testID="copy-line" accessibilityLiveRegion="polite">
              {copied}
            </Text>
          )}
        </View>
        <View style={styles.card} testID="settings-purchases">
          <Text style={styles.cardTitle}>Purchases</Text>
          <Text style={styles.stat}>Bought something on another device? Get it back here.</Text>
          <Pressable testID="restore-purchases" accessibilityRole="button" accessibilityLabel="Restore Purchases" accessibilityState={{ busy: restoring, disabled: restoring }} disabled={restoring} onPress={restore} style={[styles.action, restoring && { opacity: 0.6 }]}>
            <Text style={styles.actionText}>Restore Purchases</Text>
          </Pressable>
          {restored !== '' && (
            <Text style={[styles.stat, { marginTop: 6 }]} testID="restore-line" accessibilityLiveRegion="polite">
              {restored}
            </Text>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Start over</Text>
          <Text style={styles.stat}>Erases your shop, cash, and story progress on this device.</Text>
          <View style={{ marginTop: 10 }}>
            {confirm ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <BuyButton label="Cancel" enabled onPress={() => setConfirm(false)} />
                </View>
                <Pressable
                  testID="confirm-reset"
                  style={styles.danger}
                  onPress={async () => {
                    await resetGame();
                    router.back();
                  }}>
                  <Text style={styles.dangerText}>Yes, erase</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.danger} onPress={() => setConfirm(true)} testID="reset">
                <Text style={styles.dangerText}>Reset game</Text>
              </Pressable>
            )}
          </View>
        </View>
        <Text style={styles.version}>Slice Empire v{APP_VERSION}</Text>
      </ScrollView>
    </View>
  );
}

function Toggle({ label, on, onPress, testID, whole = false }: { label: string; on: boolean; onPress: () => void; testID: string; /** `label` already says On or Off. */ whole?: boolean }) {
  return (
    <Pressable testID={testID} accessibilityRole="switch" accessibilityLabel={whole ? label : undefined} accessibilityState={{ checked: on }} onPress={onPress} style={[styles.toggle, on ? styles.toggleOn : styles.toggleOff]}>
      <Text style={[styles.toggleText, { color: on ? '#fff' : C.inkSoft }]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.15}>
        {whole ? label : `${label}: ${on ? 'On' : 'Off'}`}
      </Text>
    </Pressable>
  );
}

/** Opens a page of the site in the in-app browser. */
function LinkButton({ label, url, testID }: { label: string; url: string; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="link" accessibilityLabel={label} onPress={() => void WebBrowser.openBrowserAsync(url).catch(() => {})} style={[styles.action, { flex: 1 }]}>
      <Text style={styles.actionText} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.15}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: { flex: 1, minHeight: BUTTON_H, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4 },
  toggleOn: { backgroundColor: C.basil, borderColor: C.basilDark },
  toggleOff: { backgroundColor: '#E2D9CE', borderColor: '#C9BCAD' },
  toggleText: { fontFamily: F.bold, fontSize: 17 },
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 4, backgroundColor: C.tomato, borderBottomWidth: 4, borderColor: C.tomatoDark },
  back: { width: 70, minHeight: TAP.min, justifyContent: 'center' },
  backText: { fontFamily: F.bold, color: '#fff', fontSize: 18 },
  title: { fontFamily: F.bold, color: '#fff', fontSize: 24 },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 3, borderColor: C.ink, padding: 14 },
  cardTitle: { fontFamily: F.bold, fontSize: 19, color: C.ink, marginBottom: 4 },
  stat: { fontFamily: F.regular, fontSize: 15, color: C.inkSoft },
  danger: { flex: 1, backgroundColor: C.tomato, borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 4, borderColor: C.tomatoDark },
  dangerText: { fontFamily: F.bold, color: '#fff', fontSize: 17 },
  version: { textAlign: 'center', fontFamily: F.regular, color: C.inkSoft },
  action: { minHeight: BUTTON_H, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, marginTop: 10, backgroundColor: '#fff', borderWidth: 2.5, borderColor: C.ink, borderBottomWidth: 4 },
  actionText: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  idText: { fontFamily: F.semi, fontSize: 13, color: C.ink, marginTop: 8 },
});
