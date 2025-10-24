import { AddIcon } from "@chakra-ui/icons";
import { Box, Stack, Text, Flex } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import axios from "axios";
// MODIFIED: Import useEffect, useState, and useCallback
import { useEffect, useState, useCallback } from "react";
import { getSender } from "../config/ChatLogics";
import ChatLoading from "./ChatLoading";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import { Button, Badge } from "@chakra-ui/react";
import { ChatState } from "../Context/ChatProvider";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();

  const {
    selectedChat,
    setSelectedChat,
    user,
    chats,
    setChats,
    notification,
    setNotification,
    onlineUsers,
  } = ChatState();

  const toast = useToast();

  // MODIFIED: Wrap fetchChats in useCallback
  const fetchChats = useCallback(async () => {
    // We check for 'user' here to prevent running on initial load if user isn't ready
    if (!user) {
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("/api/chat", config);
      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
    // MODIFIED: Add dependencies for useCallback
  }, [user, setChats, toast]); // Include all external variables used inside

  useEffect(() => {
    if (user) {
      setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
      fetchChats(); // Now this is safe to call
    }
    // MODIFIED: Add fetchChats to the dependency array
  }, [fetchAgain, user, fetchChats]); // 'fetchChats' is now stable

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg="white"
      w={{ base: "100%", md: "31%" }}
      borderRadius="lg"
      borderWidth="1px"
    >
      {/* ... (Rest of your component code is unchanged) ... */}
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "28px", md: "30px" }}
        fontFamily="Work sans"
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        My Chats
        <GroupChatModal>
          <Button
            display="flex"
            fontSize={{ base: "17px", md: "10px", lg: "17px" }}
            rightIcon={<AddIcon />}
          >
            New Group Chat
          </Button>
        </GroupChatModal>
      </Box>
      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg="#F8F8F8"
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="hidden"
      >
        {chats ? (
          <Stack overflowY="scroll">
            {chats.map((chat) => {
              const otherUser =
                loggedUser && !chat.isGroupChat
                  ? chat.users.find((u) => u._id !== loggedUser._id)
                  : null;

              const isOnline = otherUser
                ? onlineUsers.includes(otherUser._id)
                : false;

              const notificationCount = notification.filter(
                (n) => n.chat._id === chat._id
              ).length;

              return (
                <Box
                  onClick={() => {
                    setSelectedChat(chat);
                    setNotification(
                      notification.filter((n) => n.chat._id !== chat._id)
                    );
                  }}
                  cursor="pointer"
                  bg={selectedChat === chat ? "#38B2AC" : "#E8E8E8"}
                  color={selectedChat === chat ? "white" : "black"}
                  px={3}
                  py={2}
                  borderRadius="lg"
                  key={chat._id}
                >
                  <Flex justifyContent="space-between" alignItems="center">
                    <Flex alignItems="center" gap={2}>
                      {loggedUser && !chat.isGroupChat && (
                        <Box
                          w="8px"
                          h="8px"
                          borderRadius="full"
                          bg={isOnline ? "green.500" : "gray.400"}
                          title={isOnline ? "Online" : "Offline"}
                        />
                      )}
                      <Text>
                        {!chat.isGroupChat
                          ? getSender(loggedUser, chat.users)
                          : chat.chatName}
                      </Text>
                    </Flex>
                    {notificationCount > 0 && (
                      <Badge
                        colorScheme="green"
                        borderRadius="full"
                        px={2}
                        fontSize="0.8em"
                        title={`${notificationCount} new message${
                          notificationCount > 1 ? "s" : ""
                        }`}
                      >
                        {notificationCount}
                      </Badge>
                    )}
                  </Flex>

                  {chat.latestMessage && (
                    <Text
                      fontSize="xs"
                      color={selectedChat === chat ? "gray.200" : "gray.600"}
                    >
                      <b>{chat.latestMessage.sender.name} : </b>
                      {chat.latestMessage.content.length > 50
                        ? chat.latestMessage.content.substring(0, 51) + "..."
                        : chat.latestMessage.content}
                    </Text>
                  )}
                </Box>
              );
            })}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChats;