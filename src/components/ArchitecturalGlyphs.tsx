import React from 'react';
import {
  Activity as LucideActivity,
  AlertTriangle as LucideAlertTriangle,
  ArrowDownCircle as LucideArrowDownCircle,
  ArrowUpCircle as LucideArrowUpCircle,
  ArrowUpRight as LucideArrowUpRight,
  Award as LucideAward,
  BadgeCheck as LucideBadgeCheck,
  BarChart3 as LucideBarChart3,
  Bell as LucideBell,
  BookOpen as LucideBookOpen,
  Bookmark as LucideBookmark,
  Calendar as LucideCalendar,
  Camera as LucideCamera,
  Check as LucideCheck,
  CheckCircle2 as LucideCheckCircle2,
  ChevronDown as LucideChevronDown,
  ChevronRight as LucideChevronRight,
  ChevronUp as LucideChevronUp,
  Clock as LucideClock,
  CloudRain as LucideCloudRain,
  Coffee as LucideCoffee,
  Copy as LucideCopy,
  CornerDownRight as LucideCornerDownRight,
  Download as LucideDownload,
  ExternalLink as LucideExternalLink,
  Feather as LucideFeather,
  FileSpreadsheet as LucideFileSpreadsheet,
  FileText as LucideFileText,
  Filter as LucideFilter,
  Flame as LucideFlame,
  Gamepad2 as LucideGamepad2,
  Globe as LucideGlobe,
  Hash as LucideHash,
  Heart as LucideHeart,
  HeartHandshake as LucideHeartHandshake,
  History as LucideHistory,
  Home as LucideHome,
  Image as LucideImage,
  Info as LucideInfo,
  Layers as LucideLayers,
  Link2 as LucideLink2,
  Lock as LucideLock,
  LogOut as LucideLogOut,
  Mail as LucideMail,
  Maximize2 as LucideMaximize2,
  MessageCircle as LucideMessageCircle,
  MessageSquare as LucideMessageSquare,
  Mic as LucideMic,
  MicOff as LucideMicOff,
  Minus as LucideMinus,
  Moon as LucideMoon,
  Music as LucideMusic,
  PartyPopper as LucidePartyPopper,
  Pause as LucidePause,
  PhoneCall as LucidePhoneCall,
  PhoneOff as LucidePhoneOff,
  Pin as LucidePin,
  Play as LucidePlay,
  Plus as LucidePlus,
  PlusCircle as LucidePlusCircle,
  QrCode as LucideQrCode,
  Radio as LucideRadio,
  Repeat2 as LucideRepeat2,
  RotateCcw as LucideRotateCcw,
  Search as LucideSearch,
  Send as LucideSend,
  Share2 as LucideShare2,
  ShieldAlert as LucideShieldAlert,
  ShieldCheck as LucideShieldCheck,
  Sliders as LucideSliders,
  Smartphone as LucideSmartphone,
  Snowflake as LucideSnowflake,
  Sparkles as LucideSparkles,
  Sun as LucideSun,
  Tag as LucideTag,
  Target as LucideTarget,
  Trash2 as LucideTrash2,
  Trees as LucideTrees,
  TrendingDown as LucideTrendingDown,
  TrendingUp as LucideTrendingUp,
  Trophy as LucideTrophy,
  User as LucideUser,
  UserCheck as LucideUserCheck,
  UserPlus as LucideUserPlus,
  Users as LucideUsers,
  Video as LucideVideo,
  VideoOff as LucideVideoOff,
  Volume2 as LucideVolume2,
  VolumeX as LucideVolumeX,
  Waves as LucideWaves,
  X as LucideX,
  Zap as LucideZap,
  ZoomIn as LucideZoomIn,
  ZoomOut as LucideZoomOut,
  type LucideProps,
} from 'lucide-react';

export interface ArchitecturalGlyphProps extends Omit<LucideProps, 'ref'> {
  size?: number | string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
  color?: string;
  fill?: string;
  'data-testid'?: string;
}

function createArchitecturalGlyph(
  glyphName: string,
  IconComponent: React.ComponentType<LucideProps>
) {
  const GlyphComponent: React.FC<ArchitecturalGlyphProps> = (props) => {
    const {
      size = 16,
      strokeWidth = 2,
      className = '',
      ...rest
    } = props;

    const hasExplicitWidthOrHeight = /\b(w-|h-|size-)/.test(className);
    const mergedClassName = `inline-block shrink-0 select-none ${
      hasExplicitWidthOrHeight ? '' : 'w-4 h-4'
    } ${className}`.trim();

    return (
      <IconComponent
        size={size}
        strokeWidth={strokeWidth}
        aria-hidden={rest['aria-label'] || rest.role ? undefined : true}
        {...rest}
        data-architectural-glyph={glyphName}
        className={mergedClassName}
      />
    );
  };

  GlyphComponent.displayName = `ArchitecturalGlyph(${glyphName})`;
  return GlyphComponent;
}

export const Activity = createArchitecturalGlyph('Activity', LucideActivity);
export const AlertTriangle = createArchitecturalGlyph('AlertTriangle', LucideAlertTriangle);
export const ArrowDownCircle = createArchitecturalGlyph('ArrowDownCircle', LucideArrowDownCircle);
export const ArrowUpCircle = createArchitecturalGlyph('ArrowUpCircle', LucideArrowUpCircle);
export const ArrowUpRight = createArchitecturalGlyph('ArrowUpRight', LucideArrowUpRight);
export const Award = createArchitecturalGlyph('Award', LucideAward);
export const BadgeCheck = createArchitecturalGlyph('BadgeCheck', LucideBadgeCheck);
export const BarChart3 = createArchitecturalGlyph('BarChart3', LucideBarChart3);
export const Bell = createArchitecturalGlyph('Bell', LucideBell);
export const BookOpen = createArchitecturalGlyph('BookOpen', LucideBookOpen);
export const Bookmark = createArchitecturalGlyph('Bookmark', LucideBookmark);
export const Calendar = createArchitecturalGlyph('Calendar', LucideCalendar);
export const Camera = createArchitecturalGlyph('Camera', LucideCamera);
export const Check = createArchitecturalGlyph('Check', LucideCheck);
export const CheckCircle2 = createArchitecturalGlyph('CheckCircle2', LucideCheckCircle2);
export const ChevronDown = createArchitecturalGlyph('ChevronDown', LucideChevronDown);
export const ChevronRight = createArchitecturalGlyph('ChevronRight', LucideChevronRight);
export const ChevronUp = createArchitecturalGlyph('ChevronUp', LucideChevronUp);
export const Clock = createArchitecturalGlyph('Clock', LucideClock);
export const CloudRain = createArchitecturalGlyph('CloudRain', LucideCloudRain);
export const Coffee = createArchitecturalGlyph('Coffee', LucideCoffee);
export const Copy = createArchitecturalGlyph('Copy', LucideCopy);
export const CornerDownRight = createArchitecturalGlyph('CornerDownRight', LucideCornerDownRight);
export const Download = createArchitecturalGlyph('Download', LucideDownload);
export const ExternalLink = createArchitecturalGlyph('ExternalLink', LucideExternalLink);
export const Feather = createArchitecturalGlyph('Feather', LucideFeather);
export const FileSpreadsheet = createArchitecturalGlyph('FileSpreadsheet', LucideFileSpreadsheet);
export const FileText = createArchitecturalGlyph('FileText', LucideFileText);
export const Filter = createArchitecturalGlyph('Filter', LucideFilter);
export const Flame = createArchitecturalGlyph('Flame', LucideFlame);
export const Gamepad2 = createArchitecturalGlyph('Gamepad2', LucideGamepad2);
export const Globe = createArchitecturalGlyph('Globe', LucideGlobe);
export const Hash = createArchitecturalGlyph('Hash', LucideHash);
export const Heart = createArchitecturalGlyph('Heart', LucideHeart);
export const HeartHandshake = createArchitecturalGlyph('HeartHandshake', LucideHeartHandshake);
export const History = createArchitecturalGlyph('History', LucideHistory);
export const Home = createArchitecturalGlyph('Home', LucideHome);
export const Image = createArchitecturalGlyph('Image', LucideImage);
export const Info = createArchitecturalGlyph('Info', LucideInfo);
export const Layers = createArchitecturalGlyph('Layers', LucideLayers);
export const Link2 = createArchitecturalGlyph('Link2', LucideLink2);
export const Lock = createArchitecturalGlyph('Lock', LucideLock);
export const LogOut = createArchitecturalGlyph('LogOut', LucideLogOut);
export const Mail = createArchitecturalGlyph('Mail', LucideMail);
export const Maximize2 = createArchitecturalGlyph('Maximize2', LucideMaximize2);
export const MessageCircle = createArchitecturalGlyph('MessageCircle', LucideMessageCircle);
export const MessageSquare = createArchitecturalGlyph('MessageSquare', LucideMessageSquare);
export const Mic = createArchitecturalGlyph('Mic', LucideMic);
export const MicOff = createArchitecturalGlyph('MicOff', LucideMicOff);
export const Minus = createArchitecturalGlyph('Minus', LucideMinus);
export const Moon = createArchitecturalGlyph('Moon', LucideMoon);
export const Music = createArchitecturalGlyph('Music', LucideMusic);
export const PartyPopper = createArchitecturalGlyph('PartyPopper', LucidePartyPopper);
export const Pause = createArchitecturalGlyph('Pause', LucidePause);
export const PhoneCall = createArchitecturalGlyph('PhoneCall', LucidePhoneCall);
export const PhoneOff = createArchitecturalGlyph('PhoneOff', LucidePhoneOff);
export const Pin = createArchitecturalGlyph('Pin', LucidePin);
export const Play = createArchitecturalGlyph('Play', LucidePlay);
export const Plus = createArchitecturalGlyph('Plus', LucidePlus);
export const PlusCircle = createArchitecturalGlyph('PlusCircle', LucidePlusCircle);
export const QrCode = createArchitecturalGlyph('QrCode', LucideQrCode);
export const Radio = createArchitecturalGlyph('Radio', LucideRadio);
export const Repeat2 = createArchitecturalGlyph('Repeat2', LucideRepeat2);
export const RotateCcw = createArchitecturalGlyph('RotateCcw', LucideRotateCcw);
export const Search = createArchitecturalGlyph('Search', LucideSearch);
export const Send = createArchitecturalGlyph('Send', LucideSend);
export const Share2 = createArchitecturalGlyph('Share2', LucideShare2);
export const ShieldAlert = createArchitecturalGlyph('ShieldAlert', LucideShieldAlert);
export const ShieldCheck = createArchitecturalGlyph('ShieldCheck', LucideShieldCheck);
export const Sliders = createArchitecturalGlyph('Sliders', LucideSliders);
export const Smartphone = createArchitecturalGlyph('Smartphone', LucideSmartphone);
export const Snowflake = createArchitecturalGlyph('Snowflake', LucideSnowflake);
export const Sparkles = createArchitecturalGlyph('Sparkles', LucideSparkles);
export const Sun = createArchitecturalGlyph('Sun', LucideSun);
export const Tag = createArchitecturalGlyph('Tag', LucideTag);
export const Target = createArchitecturalGlyph('Target', LucideTarget);
export const Trash2 = createArchitecturalGlyph('Trash2', LucideTrash2);
export const Trees = createArchitecturalGlyph('Trees', LucideTrees);
export const TrendingDown = createArchitecturalGlyph('TrendingDown', LucideTrendingDown);
export const TrendingUp = createArchitecturalGlyph('TrendingUp', LucideTrendingUp);
export const Trophy = createArchitecturalGlyph('Trophy', LucideTrophy);
export const User = createArchitecturalGlyph('User', LucideUser);
export const UserCheck = createArchitecturalGlyph('UserCheck', LucideUserCheck);
export const UserPlus = createArchitecturalGlyph('UserPlus', LucideUserPlus);
export const Users = createArchitecturalGlyph('Users', LucideUsers);
export const Video = createArchitecturalGlyph('Video', LucideVideo);
export const VideoOff = createArchitecturalGlyph('VideoOff', LucideVideoOff);
export const Volume2 = createArchitecturalGlyph('Volume2', LucideVolume2);
export const VolumeX = createArchitecturalGlyph('VolumeX', LucideVolumeX);
export const Waves = createArchitecturalGlyph('Waves', LucideWaves);
export const X = createArchitecturalGlyph('X', LucideX);
export const Zap = createArchitecturalGlyph('Zap', LucideZap);
export const ZoomIn = createArchitecturalGlyph('ZoomIn', LucideZoomIn);
export const ZoomOut = createArchitecturalGlyph('ZoomOut', LucideZoomOut);
