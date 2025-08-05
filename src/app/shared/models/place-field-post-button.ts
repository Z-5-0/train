export interface PlaceFieldPostButton {
    icon: string;
    disabled?: boolean,
    action: ButtonAction
}

type ButtonAction = (() => void) | null;