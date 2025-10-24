// MODIFIED: Import AvatarBadge to show status
import { Avatar, AvatarBadge } from "@chakra-ui/avatar";
import { Box, Text } from "@chakra-ui/layout";
// NEW: Import ChatState to access the list of online users
import { ChatState } from "../../Context/ChatProvider";
const UserListItem = ({ user, handleFunction }) => {
  // NEW: Get the list of online users from the global context
  const { onlineUsers } = ChatState();

  // NEW: Check if this specific user's ID is in the online list
  const isOnline = onlineUsers.includes(user._id);

  return (
    <Box
      onClick={handleFunction}
      cursor="pointer"
      bg="#E8E8E8"
      _hover={{
        background: "#38B2AC",
        color: "white",
      }}
      w="100%"
      d="flex"
      alignItems="center"
      color="black"
      px={3}
      py={2}
      mb={2}
      borderRadius="lg"
    >
      <Avatar
        mr={2}
        size="sm"
        cursor="pointer"
        name={user.name}
        src={user.pic}
      >
        {/* NEW: Add the online/offline badge */}
        <AvatarBadge
          boxSize="1.25em"
          // MODIFIED: Show green for online, gray for offline
          bg={isOnline ? "green.500" : "gray.400"}
          title={isOnline ? "Online" : "Offline"} // Add a tooltip
        />
      </Avatar>
      <Box>
        <Text>{user.name}</Text>
        <Text fontSize="xs">
          <b>Email : </b>
          {user.email}
        </Text>
      </Box>
    </Box>
  );
};

export default UserListItem;