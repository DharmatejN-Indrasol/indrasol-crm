import { ListItem, Stack, Typography } from '@mui/material';
import { Fragment, ReactNode } from 'react';

type ActivityLogContactNoteCreatedProps = {
    header: ReactNode;
    text: string;
};

export function ActivityLogNote({
    header,
    text,
}: ActivityLogContactNoteCreatedProps) {
    if (!text) {
        return null;
    }
    const paragraphs = text.split('\n');

    return (
        <ListItem disableGutters sx={{ animation: 'fadeInCard 0.5s cubic-bezier(0.4,0,0.2,1)' }}>
            <Stack direction="column" spacing={2} sx={{ width: '100%' }}>
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                    width="100%"
                >
                    {header}
                </Stack>
                <div>
                    <Typography
                        variant="body2"
                        sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: '3',
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {paragraphs.map((paragraph: string, index: number) => (
                            <Fragment key={index}>
                                {paragraph}
                                {index < paragraphs.length - 1 && <br />}
                            </Fragment>
                        ))}
                    </Typography>
                </div>
            </Stack>
        </ListItem>
    );
}
