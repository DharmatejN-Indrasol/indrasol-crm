import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const DialogCloseButton = ({
    onClose,
    top = 8,
    right = 8,
    color,
}: {
    onClose: () => void;
    top?: number;
    right?: number;
    color?: string;
}) => {
    return (
        <IconButton
            aria-label="close"
            onClick={onClose}
            tabIndex={0}
            sx={{
                position: 'absolute',
                right,
                top,
                color: theme => (color ? color : theme.palette.grey[500]),
                '&:focus-visible': {
                  outline: '2px solid #2563eb',
                  outlineOffset: 2,
                },
            }}
        >
            <CloseIcon />
        </IconButton>
    );
};
