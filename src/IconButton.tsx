import * as Gtk from "@gtkx/ffi/gtk";
import { GtkBox, GtkButton, GtkImage, GtkLabel } from "@gtkx/react";

type IconButtonProps = {
  iconName: string;
  label: string;
  onClick?: () => void;
  cssClasses?: string[];
  sensitive?: boolean;
  hexpand?: boolean;
  halign?: Gtk.Align;
};

export const IconButton = ({
  iconName,
  label,
  onClick,
  cssClasses = ["pill"],
  sensitive = true,
  hexpand = false,
  halign = Gtk.Align.CENTER,
}: IconButtonProps) => (
  <GtkButton
    onClicked={onClick}
    cssClasses={cssClasses}
    sensitive={sensitive}
    hexpand={hexpand}
    halign={halign}
  >
    <GtkBox
      orientation={Gtk.Orientation.HORIZONTAL}
      spacing={8}
      halign={Gtk.Align.CENTER}
    >
      <GtkImage iconName={iconName} iconSize={Gtk.IconSize.NORMAL} />
      <GtkLabel label={label} />
    </GtkBox>
  </GtkButton>
);
