import { CloseIcon } from "@chakra-ui/icons";
import { Badge } from "@chakra-ui/react"; // Note: It's better to import from @chakra-ui/react

const UserBadgeItem = ({ user, handleFunction, admin }) => {
  // Check if the user being rendered is the admin of the group
  const isUserAdmin = admin && user._id === admin._id;

  return (
    <Badge
      px={2}
      py={1}
      borderRadius="lg"
      m={1}
      mb={2}
      variant="solid"
      fontSize={12}
      colorScheme="purple"
      display="flex"
      alignItems="center"
    >
      {user.name}
      {/* Conditionally render the ADMIN tag */}
      {isUserAdmin && <span style={{ fontWeight: 'bold', marginLeft: '4px' }}>(ADMIN)</span>}
      {/* The onClick should be on the icon, not the whole badge */}
      <CloseIcon pl={1} ml={2} cursor="pointer" onClick={handleFunction} />
    </Badge>
  );
};

export default UserBadgeItem;