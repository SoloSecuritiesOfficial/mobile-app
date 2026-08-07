import React, {
  useEffect,
  useState,
} from "react";

import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../services/notificationService";

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationScreen() {

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications =
    async () => {

      try {

        const response =
          await getNotifications();

        setNotifications(
          response.data || []
        );

      } catch (error) {

        console.log(
          "Notification Error:",
          error
        );

      } finally {

        setLoading(false);
        setRefreshing(false);

      }

    };

  const onRefresh = () => {

    setRefreshing(true);

    loadNotifications();

  };

  const handleRead =
    async (id: string) => {

      try {

        await markNotificationAsRead(id);

        setNotifications(prev =>
          prev.map(item =>
            item._id === id
              ? {
                  ...item,
                  isRead: true,
                }
              : item
          )
        );

      } catch (error) {

        console.log(error);

      }

    };

  const handleDelete =
    async (id: string) => {

      try {

        await deleteNotification(id);

        setNotifications(prev =>
          prev.filter(
            item => item._id !== id
          )
        );

      } catch (error) {

        console.log(error);

      }

    };

  const handleReadAll =
    async () => {

      try {

        await markAllNotificationsAsRead();

        setNotifications(prev =>
          prev.map(item => ({
            ...item,
            isRead: true,
          }))
        );

      } catch (error) {

        console.log(error);

      }

    };

  if (loading) {

    return (

      <SafeAreaView style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />
      </SafeAreaView>

    );

  }

  return (

    <SafeAreaView style={styles.container}>

      <View style={styles.header}>

        <Text style={styles.title}>
          Notifications
        </Text>

        <TouchableOpacity
          onPress={handleReadAll}
        >
          <Text style={styles.readAll}>
            Mark All Read
          </Text>
        </TouchableOpacity>

      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No Notifications
            </Text>
          </View>
        }
        renderItem={({ item }) => (

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.card,
              !item.isRead &&
                styles.unreadCard,
            ]}
            onPress={() =>
              handleRead(item._id)
            }
          >

            <Text style={styles.cardTitle}>
              {item.title}
            </Text>

            <Text style={styles.message}>
              {item.message}
            </Text>

            <Text style={styles.date}>
              {new Date(
                item.createdAt
              ).toLocaleString()}
            </Text>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() =>
                handleDelete(item._id)
              }
            >
              <Text
                style={
                  styles.deleteText
                }
              >
                Delete
              </Text>
            </TouchableOpacity>

          </TouchableOpacity>

        )}
      />

    </SafeAreaView>

  );

}

const styles =
StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
  },

  readAll: {
    color: "#2563EB",
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 18,
    borderRadius: 16,
    elevation: 2,
  },

  unreadCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#2563EB",
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },

  message: {
    marginTop: 8,
    color: "#555",
    lineHeight: 22,
  },

  date: {
    marginTop: 12,
    color: "#888",
    fontSize: 13,
  },

  deleteButton: {
    alignSelf: "flex-end",
    marginTop: 15,
  },

  deleteText: {
    color: "#E53935",
    fontWeight: "700",
  },

  empty: {
    marginTop: 80,
    alignItems: "center",
  },

  emptyText: {
    color: "#777",
    fontSize: 16,
  },

});