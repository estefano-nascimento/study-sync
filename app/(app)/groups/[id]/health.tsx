import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';

let VictoryLine: any = () => null;
let VictoryBar: any = () => null;
let VictoryChart: any = ({ children }: any) => children;
let VictoryAxis: any = () => null;

if (Platform.OS !== 'web') {
  try {
    const victory = require('victory-native');
    VictoryLine = victory.VictoryLine;
    VictoryBar = victory.VictoryBar;
    VictoryChart = victory.VictoryChart;
    VictoryAxis = victory.VictoryAxis;
  } catch {}
}
import { subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../../../lib/supabase';
import { useThemeStore } from '../../../../store/themeStore';
import { Task } from '../../../../lib/types';
import { Card } from '../../../../components/Card';
import { StatusChip } from '../../../../components/StatusChip';
import { CardSkeleton } from '../../../../components/SkeletonLoader';
import { typography, spacing } from '../../../../lib/theme';
import { formatDate } from '../../../../lib/utils';

function GaugeChart({ value, color, size = 200 }: { value: number; color: string; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 16;
  const startAngle = -Math.PI;
  const endAngle = 0;
  const sweep = endAngle - startAngle;
  const angle = startAngle + sweep * (value / 100);

  const toXY = (a: number) => ({
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  });

  const start = toXY(startAngle);
  const end = toXY(endAngle);
  const current = toXY(angle);

  const bgPath = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
  const valuePath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${value > 50 ? 1 : 0} 1 ${current.x} ${current.y}`;

  return (
    <Svg width={size} height={size / 2 + 16}>
      <G>
        <Path d={bgPath} stroke="#334155" strokeWidth={14} fill="none" strokeLinecap="round" />
        <Path d={valuePath} stroke={color} strokeWidth={14} fill="none" strokeLinecap="round" />
        <SvgText
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={28}
          fontWeight="700"
          fill={color}
        >
          {Math.round(value)}%
        </SvgText>
        <SvgText x={cx} y={cy + 14} textAnchor="middle" fontSize={12} fill="#94A3B8">
          Saúde do projeto
        </SvgText>
      </G>
    </Svg>
  );
}

export default function HealthScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusData, setFocusData] = useState<{ x: string; y: number }[]>([]);
  const [completionData, setCompletionData] = useState<{ x: string; y: number }[]>([]);

  useEffect(() => { if (id) fetchData(); }, [id]);

  async function fetchData() {
    setLoading(true);
    const [taskRes, sessionRes] = await Promise.all([
      supabase.from('tasks').select('*, subjects(name, color)').eq('group_id', id),
      supabase.from('study_sessions')
        .select('started_at, duration_minutes')
        .gte('started_at', subDays(new Date(), 14).toISOString()),
    ]);

    setTasks((taskRes.data as Task[]) || []);

    // Build focus line chart (14 days)
    const byDay: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      byDay[format(subDays(new Date(), i), 'dd/MM')] = 0;
    }
    (sessionRes.data || []).forEach((s) => {
      const day = format(new Date(s.started_at), 'dd/MM');
      if (day in byDay) byDay[day] += s.duration_minutes || 0;
    });

    const chartData = Object.entries(byDay).map(([x, y]) => ({ x, y }));
    setFocusData(chartData);

    // Build completion chart from actual task data: count done tasks per day (last 7 days)
    const completionByDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      completionByDay[format(subDays(new Date(), i), 'dd/MM')] = 0;
    }
    const doneTasks = ((taskRes.data as Task[]) || []).filter((t) => t.status === 'done');
    doneTasks.forEach((t) => {
      // Use due_date if available, otherwise created_at, as a proxy for completion date
      const dateStr = t.due_date || t.created_at;
      if (dateStr) {
        const day = format(new Date(dateStr), 'dd/MM');
        if (day in completionByDay) completionByDay[day] += 1;
      }
    });
    setCompletionData(Object.entries(completionByDay).map(([x, y]) => ({ x, y })));
    setLoading(false);
  }

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const onTrack = tasks.filter((t) => t.status !== 'done' && t.priority !== 'critical').length;
  const healthScore = total > 0 ? Math.round((done / total) * 100) : 0;
  const healthColor = healthScore >= 80 ? colors.success : healthScore >= 50 ? colors.warning : colors.danger;
  const criticalNotStarted = tasks.filter((t) => t.priority === 'critical' && t.status === 'todo');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Saúde do projeto</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.container, isWide && styles.containerWide]}>
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* Gauge */}
            <Card style={styles.gaugeCard}>
              <GaugeChart value={healthScore} color={healthColor} size={Math.min(width - 64, 280)} />
              <Text style={[styles.gaugeLabel, { color: healthColor }]}>
                {healthScore >= 80 ? 'Ritmo saudável' : healthScore >= 50 ? 'Atenção necessária' : 'Risco real'}
              </Text>
            </Card>

            {/* KPI row */}
            <View style={[styles.kpiRow, isWide && styles.kpiRowWide]}>
              <Card style={styles.kpiCard}>
                <Text style={[styles.kpiValue, { color: colors.success }]}>{done}</Text>
                <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Concluídas</Text>
              </Card>
              <Card style={styles.kpiCard}>
                <Text style={[styles.kpiValue, { color: colors.primary }]}>{onTrack}</Text>
                <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>No prazo</Text>
              </Card>
              <Card style={styles.kpiCard}>
                <Text style={[styles.kpiValue, { color: colors.danger }]}>{criticalNotStarted.length}</Text>
                <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Críticas</Text>
              </Card>
            </View>

            {/* Completion chart */}
            <Card>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Tarefas concluídas por dia</Text>
              <VictoryChart height={160} padding={{ top: 10, bottom: 30, left: 30, right: 10 }}>
                <VictoryAxis
                  style={{ tickLabels: { fill: colors.textSecondary, fontSize: 9 }, axis: { stroke: colors.border } }}
                  tickCount={7}
                />
                <VictoryAxis
                  dependentAxis
                  style={{ tickLabels: { fill: colors.textSecondary, fontSize: 10 }, axis: { stroke: colors.border } }}
                />
                <VictoryLine
                  data={completionData}
                  style={{ data: { stroke: colors.success, strokeWidth: 2 } }}
                />
              </VictoryChart>
            </Card>

            {/* Focus chart */}
            <Card>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Minutos de foco (14 dias)</Text>
              <VictoryChart height={160} padding={{ top: 10, bottom: 30, left: 40, right: 10 }}>
                <VictoryAxis
                  style={{ tickLabels: { fill: colors.textSecondary, fontSize: 8 }, axis: { stroke: colors.border } }}
                  tickCount={7}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t) => `${t}m`}
                  style={{ tickLabels: { fill: colors.textSecondary, fontSize: 10 }, axis: { stroke: colors.border } }}
                />
                <VictoryBar
                  data={focusData}
                  style={{ data: { fill: colors.primary + 'CC' } }}
                  cornerRadius={{ top: 3 }}
                />
              </VictoryChart>
            </Card>

            {/* Critical not started */}
            {criticalNotStarted.length > 0 && (
              <Card>
                <View style={styles.critHeader}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    Críticas não iniciadas
                  </Text>
                  <View style={[styles.critBadge, { backgroundColor: colors.danger }]}>
                    <Text style={styles.critBadgeText}>{criticalNotStarted.length}</Text>
                  </View>
                </View>
                {criticalNotStarted.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => router.push(`/(app)/tasks/${t.id}` as any)}
                    style={[styles.critItem, { borderBottomColor: colors.border }]}
                    accessibilityLabel={`Tarefa crítica ${t.title}`}
                  >
                    <Ionicons name="warning" size={16} color={colors.danger} />
                    <Text style={[styles.critTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {t.title}
                    </Text>
                    {t.due_date && (
                      <Text style={[styles.critDue, { color: colors.danger }]}>{formatDate(t.due_date)}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </Card>
            )}

            {/* Alerts */}
            <Card>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Alertas ativos</Text>
              {criticalNotStarted.length > 0 && (
                <View style={[styles.alert, { backgroundColor: colors.danger + '1A' }]}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={[styles.alertText, { color: colors.danger }]}>
                    {criticalNotStarted.length} tarefas críticas aguardando início
                  </Text>
                </View>
              )}
              {healthScore < 50 && (
                <View style={[styles.alert, { backgroundColor: colors.warning + '1A' }]}>
                  <Ionicons name="warning" size={16} color={colors.warning} />
                  <Text style={[styles.alertText, { color: colors.warning }]}>
                    Projeto abaixo de 50% de conclusão — risco de atraso
                  </Text>
                </View>
              )}
              {criticalNotStarted.length === 0 && healthScore >= 50 && (
                <View style={[styles.alert, { backgroundColor: colors.success + '1A' }]}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[styles.alertText, { color: colors.success }]}>
                    Nenhum alerta crítico no momento
                  </Text>
                </View>
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  title: { ...typography.h3 },
  container: { padding: spacing.md, gap: spacing.md },
  containerWide: { maxWidth: 900, alignSelf: 'center', width: '100%' },
  gaugeCard: { alignItems: 'center', paddingVertical: spacing.lg },
  gaugeLabel: { ...typography.h3, marginTop: spacing.sm },
  kpiRow: { flexDirection: 'row', gap: spacing.sm },
  kpiRowWide: {},
  kpiCard: { flex: 1, alignItems: 'center', gap: 4 },
  kpiValue: { ...typography.h1, fontWeight: '800' },
  kpiLabel: { ...typography.caption },
  sectionLabel: { ...typography.caption, fontWeight: '600', textTransform: 'uppercase', marginBottom: spacing.xs },
  critHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  critBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  critBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  critItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  critTitle: { ...typography.body, flex: 1 },
  critDue: { ...typography.caption },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    marginBottom: spacing.xs,
  },
  alertText: { ...typography.caption, flex: 1 },
});
