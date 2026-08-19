import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { BookIcon, PlusIcon } from "@/components/icons";
import type { JournalEntry } from "@/types/plant";
import { formatFriendlyDate } from "@/utils/dateUtils";
import { shadowLayering } from "@/utils/shadows";
import { useTranslation } from "react-i18next";

export interface JournalTimelineProps {
  entries: JournalEntry[];
  isAddingEntry: boolean;
  onAddEntry: () => void;
}

/**
 * Journal photo timeline with an empty state and an "add photo" button.
 * Does not call the store directly — receives data and callbacks via props.
 */
export function JournalTimeline({
  entries,
  isAddingEntry,
  onAddEntry,
}: JournalTimelineProps) {
  const { t } = useTranslation();
  return (
    <View className="mt-6 px-2 pb-10">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-base font-bold tracking-tight text-slate-900">
          {t("plantDetail.journalTitle")}
        </Text>
        <TouchableOpacity
          onPress={onAddEntry}
          disabled={isAddingEntry}
          className="flex-row items-center gap-1 bg-emerald-100 px-3 py-1.5 rounded-full"
        >
          {isAddingEntry ? (
            <ActivityIndicator color="#059669" size="small" />
          ) : (
            <>
              <PlusIcon color="#059669" size={14} />
              <Text className="text-xs font-bold text-emerald-800">{t("plantDetail.journalNewPhotoBtn")}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <View
          className="items-center py-12 bg-white rounded-3xl border border-slate-100"
          style={shadowLayering.core}
        >
          <View className="bg-emerald-50 p-4 rounded-full mb-4">
            <BookIcon color="#10b981" size={24} />
          </View>
          <Text className="text-slate-800 font-bold text-base">{t("plantDetail.journalEmptyTitle")}</Text>
          <Text className="text-slate-500 text-center mt-2 px-8 text-sm">
            {t("plantDetail.journalEmptySubtitle")}
          </Text>
        </View>
      ) : (
        <View className="pl-4 border-l-2 border-emerald-100 gap-6 mt-2 ml-2">
          {entries.map((entry) => (
            <View key={entry.id} className="relative">
              <View className="absolute -left-[23px] top-4 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
              <View
                className="bg-white rounded-2xl p-3 border border-slate-100"
                style={shadowLayering.core}
              >
                <Text className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  {formatFriendlyDate(entry.created_at)}
                </Text>
                <Image
                  source={{ uri: entry.image_uri }}
                  className="w-full h-48 rounded-xl bg-slate-100"
                  resizeMode="cover"
                />
                {entry.note ? (
                  <Text className="text-sm text-slate-700 mt-3">{entry.note}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
