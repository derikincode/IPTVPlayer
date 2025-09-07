import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type IconLibrary = 'material' | 'ionicons' | 'fontawesome' | 'materialcommunity';

interface AppIconProps {
  name: string;
  size?: number;
  color?: string;
  library?: IconLibrary;
  style?: any;
}

const AppIcon: React.FC<AppIconProps> = ({ 
  name, 
  size = 24, 
  color = '#fff', 
  library = 'material',
  style
}) => {
  const iconProps = { name, size, color, style };

  switch (library) {
    case 'ionicons':
      return <Ionicons {...iconProps} />;
    case 'fontawesome':
      return <FontAwesome {...iconProps} />;
    case 'materialcommunity':
      return <MaterialCommunityIcons {...iconProps} />;
    default:
      return <MaterialIcons {...iconProps} />;
  }
};

export default AppIcon;