import React from 'react';

export interface ArchitecturalGlyphProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number | string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
  color?: string;
  fill?: string;
  'data-testid'?: string;
}

function createArchitecturalGlyph(glyphName: string, visibleMonogram?: string) {
  const GlyphComponent: React.FC<ArchitecturalGlyphProps> = (props) => {
    const {
      size: _size,
      strokeWidth: _strokeWidth,
      absoluteStrokeWidth: _absoluteStrokeWidth,
      color: _color,
      fill: _fill,
      className = '',
      children,
      ...rest
    } = props;

    const testId = rest['data-testid'];
    const ariaLabel = rest['aria-label'];
    const role = rest.role;
    const title = rest.title;

    if (visibleMonogram) {
      return (
        <span
          {...rest}
          data-architectural-glyph={glyphName}
          className={`inline-flex items-center justify-center font-mono text-[10px] uppercase tracking-wider leading-none select-none ${className}`.trim()}
        >
          {children ?? visibleMonogram}
        </span>
      );
    }

    if (testId || ariaLabel || role || title) {
      return (
        <span
          {...rest}
          data-architectural-glyph={glyphName}
          className={`inline-block shrink-0 select-none ${className}`.trim()}
          style={{ width: 0, height: 0, overflow: 'hidden', ...rest.style }}
        >
          {children}
        </span>
      );
    }

    return null;
  };

  GlyphComponent.displayName = `ArchitecturalGlyph(${glyphName})`;
  return GlyphComponent;
}

export const Activity = createArchitecturalGlyph('Activity');
export const AlertTriangle = createArchitecturalGlyph('AlertTriangle');
export const ArrowDownCircle = createArchitecturalGlyph('ArrowDownCircle');
export const ArrowUpCircle = createArchitecturalGlyph('ArrowUpCircle');
export const ArrowUpRight = createArchitecturalGlyph('ArrowUpRight');
export const Award = createArchitecturalGlyph('Award');
export const BadgeCheck = createArchitecturalGlyph('BadgeCheck');
export const BarChart3 = createArchitecturalGlyph('BarChart3');
export const Bell = createArchitecturalGlyph('Bell');
export const BookOpen = createArchitecturalGlyph('BookOpen');
export const Bookmark = createArchitecturalGlyph('Bookmark');
export const Calendar = createArchitecturalGlyph('Calendar');
export const Camera = createArchitecturalGlyph('Camera');
export const Check = createArchitecturalGlyph('Check');
export const CheckCircle2 = createArchitecturalGlyph('CheckCircle2');
export const ChevronDown = createArchitecturalGlyph('ChevronDown');
export const ChevronRight = createArchitecturalGlyph('ChevronRight');
export const ChevronUp = createArchitecturalGlyph('ChevronUp');
export const Clock = createArchitecturalGlyph('Clock');
export const CloudRain = createArchitecturalGlyph('CloudRain');
export const Coffee = createArchitecturalGlyph('Coffee');
export const Copy = createArchitecturalGlyph('Copy');
export const CornerDownRight = createArchitecturalGlyph('CornerDownRight');
export const Download = createArchitecturalGlyph('Download');
export const ExternalLink = createArchitecturalGlyph('ExternalLink');
export const Feather = createArchitecturalGlyph('Feather');
export const FileSpreadsheet = createArchitecturalGlyph('FileSpreadsheet');
export const FileText = createArchitecturalGlyph('FileText');
export const Filter = createArchitecturalGlyph('Filter');
export const Flame = createArchitecturalGlyph('Flame');
export const Gamepad2 = createArchitecturalGlyph('Gamepad2');
export const Globe = createArchitecturalGlyph('Globe');
export const Hash = createArchitecturalGlyph('Hash');
export const Heart = createArchitecturalGlyph('Heart');
export const HeartHandshake = createArchitecturalGlyph('HeartHandshake');
export const History = createArchitecturalGlyph('History');
export const Home = createArchitecturalGlyph('Home');
export const Image = createArchitecturalGlyph('Image');
export const Info = createArchitecturalGlyph('Info');
export const Layers = createArchitecturalGlyph('Layers');
export const Link2 = createArchitecturalGlyph('Link2');
export const Lock = createArchitecturalGlyph('Lock');
export const LogOut = createArchitecturalGlyph('LogOut');
export const Mail = createArchitecturalGlyph('Mail');
export const Maximize2 = createArchitecturalGlyph('Maximize2');
export const MessageCircle = createArchitecturalGlyph('MessageCircle');
export const MessageSquare = createArchitecturalGlyph('MessageSquare');
export const Mic = createArchitecturalGlyph('Mic', 'MIC');
export const MicOff = createArchitecturalGlyph('MicOff', 'MUTE');
export const Minus = createArchitecturalGlyph('Minus', '-');
export const Moon = createArchitecturalGlyph('Moon');
export const Music = createArchitecturalGlyph('Music');
export const PartyPopper = createArchitecturalGlyph('PartyPopper');
export const Pause = createArchitecturalGlyph('Pause');
export const PhoneCall = createArchitecturalGlyph('PhoneCall');
export const PhoneOff = createArchitecturalGlyph('PhoneOff', 'END');
export const Pin = createArchitecturalGlyph('Pin');
export const Play = createArchitecturalGlyph('Play');
export const Plus = createArchitecturalGlyph('Plus', '+');
export const PlusCircle = createArchitecturalGlyph('PlusCircle');
export const QrCode = createArchitecturalGlyph('QrCode');
export const Radio = createArchitecturalGlyph('Radio');
export const Repeat2 = createArchitecturalGlyph('Repeat2');
export const RotateCcw = createArchitecturalGlyph('RotateCcw');
export const Search = createArchitecturalGlyph('Search');
export const Send = createArchitecturalGlyph('Send', 'SEND');
export const Share2 = createArchitecturalGlyph('Share2');
export const ShieldAlert = createArchitecturalGlyph('ShieldAlert');
export const ShieldCheck = createArchitecturalGlyph('ShieldCheck');
export const Sliders = createArchitecturalGlyph('Sliders');
export const Smartphone = createArchitecturalGlyph('Smartphone');
export const Snowflake = createArchitecturalGlyph('Snowflake');
export const Sparkles = createArchitecturalGlyph('Sparkles');
export const Sun = createArchitecturalGlyph('Sun');
export const Tag = createArchitecturalGlyph('Tag');
export const Target = createArchitecturalGlyph('Target');
export const Trash2 = createArchitecturalGlyph('Trash2', 'DEL');
export const Trees = createArchitecturalGlyph('Trees');
export const TrendingDown = createArchitecturalGlyph('TrendingDown');
export const TrendingUp = createArchitecturalGlyph('TrendingUp');
export const Trophy = createArchitecturalGlyph('Trophy');
export const User = createArchitecturalGlyph('User');
export const UserCheck = createArchitecturalGlyph('UserCheck');
export const UserPlus = createArchitecturalGlyph('UserPlus');
export const Users = createArchitecturalGlyph('Users');
export const Video = createArchitecturalGlyph('Video', 'CAM');
export const VideoOff = createArchitecturalGlyph('VideoOff', 'OFF');
export const Volume2 = createArchitecturalGlyph('Volume2');
export const VolumeX = createArchitecturalGlyph('VolumeX');
export const Waves = createArchitecturalGlyph('Waves');
export const X = createArchitecturalGlyph('X', 'ESC');
export const Zap = createArchitecturalGlyph('Zap');
export const ZoomIn = createArchitecturalGlyph('ZoomIn', '+');
export const ZoomOut = createArchitecturalGlyph('ZoomOut', '-');
