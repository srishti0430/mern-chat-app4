import { Avatar } from "@chakra-ui/avatar";
import { Box, Text } from "@chakra-ui/layout";

// The component now accepts 'user' as a prop.
const UserListItem = ({ user, handleFunction }) => {
  // The problematic line `const { user } = ChatState()` has been removed.

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
        name={user.name} // This will now correctly use the user from search results
        src={user.pic}
      />
      <Box>
        <Text>{user.name}</Text> {/* This will now be correct */}
        <Text fontSize="xs">
          <b>Email : </b>
          {user.email} {/* This will also be correct */}
        </Text>
      </Box>
    </Box>
  );
};

export default UserListItem;
