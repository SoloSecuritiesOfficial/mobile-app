import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, ScrollView, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { getJobs } from "../../services/jobsService";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";
import AdBanner from "../../components/AdBanner";

type Props = NativeStackScreenProps<RootStackParamList, "Jobs">;

// ─────────────────────────────────────────────────────────────────
// Filter options
// ─────────────────────────────────────────────────────────────────
const LOCATION_FILTERS = [
  { label: "All",     value: "" },
  { label: "🌍 Remote",  value: "remote" },
  { label: "🏢 On-site", value: "onsite" },
  { label: "⚡ Hybrid",  value: "hybrid" },
];

const EXPERIENCE_FILTERS = [
  { label: "All",       value: "" },
  { label: "Entry",     value: "entry" },
  { label: "Mid",       value: "mid" },
  { label: "Senior",    value: "senior" },
  { label: "Lead",      value: "lead" },
];

const JOB_TYPE_FILTERS = [
  { label: "All",           value: "" },
  { label: "Full-time",     value: "full-time" },
  { label: "Part-time",     value: "part-time" },
  { label: "Contract",      value: "contract" },
  { label: "Internship",    value: "internship" },
];

// ─────────────────────────────────────────────────────────────────
// Colour helpers
// ─────────────────────────────────────────────────────────────────
const expColor = (level: string) =>
  ({ entry: "#2E7D32", mid: "#1565C0", senior: "#6A1B9A", lead: "#E65100" }[level] ?? "#888");

const typeColor = (type: string) =>
  ({ "full-time": "#2E7D32", "part-time": "#F9A825", contract: "#1565C0", internship: "#00695C" }[type] ?? "#888");

const locIcon = (loc: string) =>
  ({ remote: "🌍", onsite: "🏢", hybrid: "⚡" }[loc] ?? "📍");

// ─────────────────────────────────────────────────────────────────
// Job card
// ─────────────────────────────────────────────────────────────────
function JobCard({ job, onPress }: { job: any; onPress: () => void }) {
  const sal = job.salary;
  const hasSalary = sal?.min > 0 || sal?.max > 0;
  const salaryText = hasSalary
    ? `${sal.currency ?? "USD"} ${(sal.min / 1000).toFixed(0)}k${sal.max > sal.min ? `–${(sal.max / 1000).toFixed(0)}k` : "+"}`
    : "Salary not listed";

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(job.expiresAt).getTime() - Date.now()) / 86400000)
  );

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      {/* Company + location */}
      <View style={styles.cardRow}>
        <View style={styles.companyInitial}>
          <Text style={styles.companyInitialText}>
            {job.company?.charAt(0)?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.company} numberOfLines={1}>{job.company}</Text>
          <Text style={styles.location}>
            {locIcon(job.locationType)} {job.location}
          </Text>
        </View>
        {daysLeft <= 3 && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentBadgeText}>Closing soon</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>

      {/* Chips row */}
      <View style={styles.chips}>
        <View style={[styles.chip, { backgroundColor: expColor(job.experienceLevel) + "18", borderColor: expColor(job.experienceLevel) + "44" }]}>
          <Text style={[styles.chipText, { color: expColor(job.experienceLevel) }]}>{job.experienceLevel}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: typeColor(job.jobType) + "18", borderColor: typeColor(job.jobType) + "44" }]}>
          <Text style={[styles.chipText, { color: typeColor(job.jobType) }]}>{job.jobType}</Text>
        </View>
        {job.requiredSkills?.slice(0, 2).map((s: string, i: number) => (
          <View key={i} style={[styles.chip, { backgroundColor: "#F0F0F0", borderColor: "#E0E0E0" }]}>
            <Text style={[styles.chipText, { color: "#555" }]}>{s}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.salary}>💰 {salaryText}</Text>
        <Text style={styles.meta}>
          {job.views ?? 0} views · {daysLeft}d left
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────
// Filter chip row
// ─────────────────────────────────────────────────────────────────
function FilterRow<T extends string>({
  options, value, onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {options.map((o) => (
        <TouchableOpacity
          key={o.value}
          style={[styles.filterChip, value === o.value && styles.filterChipActive]}
          onPress={() => onChange(o.value as T)}
          activeOpacity={0.75}
        >
          <Text style={[styles.filterChipText, value === o.value && styles.filterChipTextActive]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Filter Modal Component
// ─────────────────────────────────────────────────────────────────
function FilterModal({
  visible,
  onClose,
  filters,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  filters: {
    locationType: string;
    experienceLevel: string;
    jobType: string;
  };
  onApply: (filters: any) => void;
}) {
  const [tempFilters, setTempFilters] = useState(filters);

  React.useEffect(() => {
    setTempFilters(filters);
  }, [filters, visible]);

  const handleApply = () => {
    onApply(tempFilters);
    onClose();
  };

  const handleClear = () => {
    const cleared = { locationType: "", experienceLevel: "", jobType: "" };
    setTempFilters(cleared);
    onApply(cleared);
    onClose();
  };

  const activeCount = [tempFilters.locationType, tempFilters.experienceLevel, tempFilters.jobType].filter(Boolean).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.filterModalContent}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>🔍 Filters</Text>
            {activeCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeCount}</Text>
              </View>
            )}
            <TouchableOpacity onPress={onClose} style={styles.filterCloseBtn}>
              <Text style={styles.filterCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterModalScroll} showsVerticalScrollIndicator={false}>
            {/* Location Type */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>📍 Location Type</Text>
              <View style={styles.filterOptions}>
                {LOCATION_FILTERS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.filterOption,
                      tempFilters.locationType === opt.value && styles.filterOptionActive,
                    ]}
                    onPress={() => setTempFilters({ ...tempFilters, locationType: opt.value })}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        tempFilters.locationType === opt.value && styles.filterOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Experience Level */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>💼 Experience Level</Text>
              <View style={styles.filterOptions}>
                {EXPERIENCE_FILTERS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.filterOption,
                      tempFilters.experienceLevel === opt.value && styles.filterOptionActive,
                    ]}
                    onPress={() => setTempFilters({ ...tempFilters, experienceLevel: opt.value })}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        tempFilters.experienceLevel === opt.value && styles.filterOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Job Type */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>⏰ Job Type</Text>
              <View style={styles.filterOptions}>
                {JOB_TYPE_FILTERS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.filterOption,
                      tempFilters.jobType === opt.value && styles.filterOptionActive,
                    ]}
                    onPress={() => setTempFilters({ ...tempFilters, jobType: opt.value })}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        tempFilters.jobType === opt.value && styles.filterOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.filterModalActions}>
            <TouchableOpacity 
              style={styles.filterClearBtn} 
              onPress={handleClear}
              disabled={activeCount === 0}
            >
              <Text style={[styles.filterClearText, activeCount === 0 && { opacity: 0.4 }]}>
                Clear All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterApplyBtn} onPress={handleApply}>
              <Text style={styles.filterApplyText}>
                Apply {activeCount > 0 ? `(${activeCount})` : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────
export default function JobsScreen({ navigation }: Props) {
  const [jobs,       setJobs]       = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);
  const [loadingMore,setLoadingMore]= useState(false);

  const [search,         setSearch]         = useState("");
  const [locationType,   setLocationType]   = useState<string>("");
  const [experienceLevel,setExperienceLevel]= useState<string>("");
  const [jobType,        setJobType]        = useState<string>("");
  const [showFilters,    setShowFilters]    = useState(false);

  const LIMIT = 15;

  const activeFilterCount = [locationType, experienceLevel, jobType].filter(Boolean).length;

  const load = useCallback(async (reset = true) => {
    if (reset) { setLoading(true); setPage(1); }
    try {
      const p = reset ? 1 : page + 1;
      const res = await getJobs({
        search:         search.trim() || undefined,
        locationType:   locationType  || undefined,
        experienceLevel:experienceLevel || undefined,
        jobType:        jobType       || undefined,
        page: p,
        limit: LIMIT,
      });
      const data = res?.data ?? [];
      if (reset) {
        setJobs(data);
      } else {
        setJobs(prev => [...prev, ...data]);
        setPage(p);
      }
      setTotal(res?.total ?? 0);
      setHasMore(data.length === LIMIT);
    } catch (e) {
      console.log("Jobs load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [search, locationType, experienceLevel, jobType, page]);

  useFocusEffect(useCallback(() => { 
    load(true); 
    
    // ✅ AUTO-REFRESH: Poll for new jobs every 10 seconds
    const pollInterval = setInterval(() => {
      load(true);
    }, 10000);
    
    return () => clearInterval(pollInterval);
  }, [search, locationType, experienceLevel, jobType]));

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    load(false);
  };

  const handleApplyFilters = (filters: any) => {
    setLocationType(filters.locationType);
    setExperienceLevel(filters.experienceLevel);
    setJobType(filters.jobType);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>💼 Cyber Jobs</Text>
          <Text style={styles.headerSub}>{total} open positions</Text>
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs, companies, skills…"
            placeholderTextColor="#999"
            value={search}
            onChangeText={(t) => { setSearch(t); }}
            returnKeyType="search"
            onSubmitEditing={() => load(true)}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ color: "#999", paddingHorizontal: 8, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Button */}
        <TouchableOpacity 
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterBtnIcon, activeFilterCount > 0 && styles.filterBtnIconActive]}>
            ⚙️
          </Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters Chips (if any) */}
      {activeFilterCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeFiltersRow}
        >
          {locationType && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>📍 {LOCATION_FILTERS.find(f => f.value === locationType)?.label}</Text>
              <TouchableOpacity onPress={() => setLocationType("")} style={styles.activeFilterRemove}>
                <Text style={styles.activeFilterRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {experienceLevel && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>💼 {experienceLevel}</Text>
              <TouchableOpacity onPress={() => setExperienceLevel("")} style={styles.activeFilterRemove}>
                <Text style={styles.activeFilterRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {jobType && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>⏰ {JOB_TYPE_FILTERS.find(f => f.value === jobType)?.label}</Text>
              <TouchableOpacity onPress={() => setJobType("")} style={styles.activeFilterRemove}>
                <Text style={styles.activeFilterRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.clearAllBtn}
            onPress={() => {
              setLocationType("");
              setExperienceLevel("");
              setJobType("");
            }}
          >
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Finding jobs…</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => navigation.navigate("JobDetails", { id: item._id })}
            />
          )}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<AdBanner marginVertical={4} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true); }}
              tintColor={Colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 16 }} />
              : !hasMore && jobs.length > 0
              ? <Text style={styles.endText}>You've seen all {total} jobs ✓</Text>
              : null
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>💼</Text>
              <Text style={styles.emptyTitle}>No jobs found</Text>
              <Text style={styles.emptyDesc}>
                {search || locationType || experienceLevel || jobType
                  ? "Try adjusting your filters"
                  : "Check back later — new jobs are posted regularly"}
              </Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={{ locationType, experienceLevel, jobType }}
        onApply={handleApplyFilters}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.screen, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:    { marginRight: 12 },
  backArrow:  { fontSize: 22, color: Colors.primary, fontWeight: "700" },
  headerTitle:{ fontSize: 20, fontWeight: "800", color: Colors.text },
  headerSub:  { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  searchBox: {
    flexDirection: "row", alignItems: "center",
    margin: Spacing.screen, marginBottom: 6,
    backgroundColor: Colors.surface,
    borderRadius: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: Colors.border,
    elevation: 1,
  },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: Colors.text },

  filterRow: { paddingHorizontal: Spacing.screen, paddingVertical: 4, gap: 8 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText:   { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  filterChipTextActive: { color: "#FFF" },

  loader:     { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loaderText: { color: Colors.textSecondary, fontSize: 13 },

  list: { padding: Spacing.screen, gap: 12, paddingBottom: 40 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
    elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardRow:    { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  companyInitial: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: Colors.primary + "22",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: Colors.primary + "33",
  },
  companyInitialText: { fontSize: 20, fontWeight: "800", color: Colors.primary },
  company:    { fontSize: 13, fontWeight: "700", color: Colors.text },
  location:   { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  urgentBadge:{ backgroundColor: "#FFEBEE", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  urgentBadgeText: { fontSize: 9, color: "#C62828", fontWeight: "700" },

  jobTitle: { fontSize: 16, fontWeight: "800", color: Colors.text, marginBottom: 10, lineHeight: 22 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 10, fontWeight: "600" },

  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  salary: { fontSize: 12, fontWeight: "700", color: "#2E7D32" },
  meta:   { fontSize: 11, color: Colors.textMuted },

  endText: { textAlign: "center", color: Colors.textMuted, fontSize: 13, paddingVertical: 20 },

  emptyCard: {
    alignItems: "center", paddingVertical: 60, paddingHorizontal: 30,
  },
  emptyIcon:  { fontSize: 52, marginBottom: 14 },
  emptyTitle: { ...Typography.h3, color: Colors.text, marginBottom: 8 },
  emptyDesc:  { fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },

  // ── New compact filter system ──
  searchContainer: { flexDirection: "row", paddingHorizontal: Spacing.screen, paddingTop: 12, paddingBottom: 8, gap: 8, alignItems: "center" },
  filterBtn: {
    width: 46, height: 46,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: "center", alignItems: "center",
    position: "relative",
    elevation: 1,
  },
  filterBtnActive: { backgroundColor: Colors.primary + "22", borderColor: Colors.primary },
  filterBtnIcon: { fontSize: 20 },
  filterBtnIconActive: { color: Colors.primary },
  filterCountBadge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24, height: 24,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#FFF",
  },
  filterCountText: { color: "#FFF", fontWeight: "700", fontSize: 11 },

  activeFiltersRow: { paddingHorizontal: Spacing.screen, paddingVertical: 8, gap: 6 },
  activeFilterChip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.primary + "22",
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    gap: 4,
  },
  activeFilterText: { fontSize: 11, fontWeight: "600", color: Colors.primary },
  activeFilterRemove: { padding: 2 },
  activeFilterRemoveText: { fontSize: 12, color: Colors.primary, fontWeight: "700" },
  clearAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#F0F0F0" },
  clearAllText: { fontSize: 11, color: "#666", fontWeight: "600" },

  // ── Filter Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  filterModalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    elevation: 10,
  },
  filterModalHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filterModalTitle: { fontSize: 18, fontWeight: "800", color: Colors.text, flex: 1 },
  filterBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12, minWidth: 28, height: 28,
    justifyContent: "center", alignItems: "center",
    marginRight: 12,
  },
  filterBadgeText: { color: "#FFF", fontWeight: "700", fontSize: 12 },
  filterCloseBtn: { padding: 6 },
  filterCloseText: { fontSize: 20, color: "#999" },

  filterModalScroll: { padding: 20 },
  filterSection: { marginBottom: 24 },
  filterSectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.text, marginBottom: 10 },
  filterOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterOption: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
    borderWidth: 1.5, borderColor: "#E0E0E0",
    minWidth: "30%",
    alignItems: "center",
  },
  filterOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterOptionText: { fontSize: 13, color: "#555", fontWeight: "600" },
  filterOptionTextActive: { color: "#FFF" },

  filterModalActions: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 20, paddingVertical: 16,
    paddingBottom: 20,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  filterClearBtn: { flex: 0.35, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: "#F0F0F0" },
  filterClearText: { fontSize: 13, fontWeight: "700", color: "#666" },
  filterApplyBtn: { flex: 0.65, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: Colors.primary },
  filterApplyText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
