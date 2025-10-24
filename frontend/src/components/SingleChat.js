import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import "./styles.css";
import { IconButton, Spinner, useToast, Button } from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { ArrowBackIcon } from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import Picker from "emoji-picker-react";

import io from "socket.io-client";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";
const ENDPOINT = "http://localhost:5000";
var socket, selectedChatCompare;

var typingTimer;
const typingTimeoutLength = 3000;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const toast = useToast();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  // MODIFIED: Destructure onlineUsers and setOnlineUsers from context
  const {
    selectedChat,
    setSelectedChat,
    user,
    notification,
    setNotification,
    onlineUsers,
    setOnlineUsers,
  } = ChatState();

  const onEmojiClick = (emojiObject) => {
    setNewMessage((prevInput) => prevInput + emojiObject.emoji);
  };

  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      setLoading(true);
      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  }, [selectedChat, user.token, toast]);

  const sendMessage = async (event) => {
    if ((event.key === "Enter" || event.type === "click") && newMessage) {
      socket.emit("stop typing", { room: selectedChat._id, user: user });
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        const { data } = await axios.post(
          "/api/message",
          {
            content: newMessage,
            chatId: selectedChat._id,
          },
          config
        );
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));

    // NEW: Listen for the list of online users from the server
    const onlineUsersListener = (usersArray) => {
      setOnlineUsers(usersArray);
    };
    socket.on("get online users", onlineUsersListener);

    socket.on("typing", (typingUser) => {
      if (typingUser._id === user._id) return;
      setTypingUsers((prev) => {
        if (!prev.some((u) => u._id === typingUser._id)) {
          return [...prev, typingUser];
        }
        return prev;
      });
    });

    socket.on("stop typing", (stoppedTypingUser) => {
      setTypingUsers((prev) =>
        prev.filter((u) => u._id !== stoppedTypingUser._id)
      );
    });

    return () => {
      // NEW: Clean up the online users listener
      socket.off("get online users", onlineUsersListener);
      socket.disconnect();
    };
    // MODIFIED: Added setOnlineUsers to dependency array
  }, [user, setOnlineUsers]);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
    setTypingUsers([]);
  }, [selectedChat, fetchMessages]);

  useEffect(() => {
    const messageListener = (newMessageRecieved) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages((prevMessages) => [...prevMessages, newMessageRecieved]);
      }
    };
    socket.on("message recieved", messageListener);

    return () => {
      socket.off("message recieved", messageListener);
    };
  }); // Note: This useEffect has no dependency array, which is generally not recommended.

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", { room: selectedChat._id, user: user });
    }

    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      setTyping(false);
      socket.emit("stop typing", { room: selectedChat._id, user: user });
    }, typingTimeoutLength);
  };

  // NEW: Get other user details for online status (calculate *before* return)
  const otherUser =
    selectedChat && !selectedChat.isGroupChat
      ? getSenderFull(user, selectedChat.users)
      : null;

  // NEW: Check if the other user is online
  const isOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {messages &&
              (!selectedChat.isGroupChat ? (
                <>
                  {/* MODIFIED: Wrapped name in Box to add status indicator */}
                  <Box display="flex" alignItems="center" gap={2}>
                    {getSender(user, selectedChat.users)}
                    {/* NEW: Online/Offline Badge */}
                    {otherUser && ( // Only show dot if otherUser is calculated
                      <Box
                        w="10px"
                        h="10px"
                        borderRadius="full"
                        bg={isOnline ? "green.500" : "gray.400"}
                        title={isOnline ? "Online" : "Offline"} // Add tooltip
                      />
                    )}
                  </Box>
                  <ProfileModal
                    // MODIFIED: Pass the pre-calculated otherUser object
                    user={otherUser}
                  />
                </>
              ) : (
                <>
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                    S
                  />
                </>
              ))}
          </Text>
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}

            <FormControl
              onKeyDown={sendMessage}
              id="first-name"
              isRequired
              mt={3}
            >
              {typingUsers.length > 0 && (
                <Box
                  display="flex"
                  alignItems="center"
                  bg="gray.100"
                  width="fit-content"
                  padding="2px 10px"
                  borderRadius="20px"
                  mb={1}
                >
                  <Lottie
                    options={defaultOptions}
                    width={35}
                    style={{
                      marginRight: 4,
                    }}
                  />
                  <Text fontSize="sm" color="gray.600">
                    {typingUsers
                      .map((u) => u.name.split(" ")[0])
                      .join(", ")}{" "}
                    {typingUsers.length === 1 ? "is" : "are"} typing...
                  </Text>
                </Box>
              )}
              <Box position="relative">
                {showPicker && (
                  <Box position="absolute" bottom="50px">
                    <Picker onEmojiClick={onEmojiClick} />
                  </Box>
                )}
                <Box display="flex">
                  <Button onClick={() => setShowPicker(!showPicker)} mr={1}>
                    😄
                  </Button>
                  <Input
                    variant="filled"
                    bg="#E0E0E0"
                    placeholder="Enter a message.."
                    value={newMessage}
                    onChange={typingHandler}
                  />
                </Box>
              </Box>
            </FormControl>
          </Box>
        </>
      ) : (
        <Box display="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;