import * as React from 'react';
import { useConfigurationContext } from '../root/ConfigurationContext';
import { DialogCloseButton } from '../misc/DialogCloseButton';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
} from '@mui/material';
import {
    DateInput,
    DeleteButton,
    EditBase,
    Form,
    required,
    SaveButton,
    SelectInput,
    TextInput,
    Toolbar,
    useNotify,
} from 'react-admin';

export const TaskEdit = ({
    open,
    close,
    taskId,
}: {
    taskId: string;
    open: boolean;
    close: () => void;
}) => {
    const { taskTypes } = useConfigurationContext();
    const notify = useNotify();
    return (
        <Dialog
            open={open}
            onClose={close}
            fullWidth
            disableRestoreFocus
            maxWidth="sm"
            aria-labelledby="task-edit-dialog-title"
        >
            <DialogCloseButton onClose={close} />
            <DialogTitle id="task-edit-dialog-title">Edit task</DialogTitle>
            <DialogContent sx={{ pb: 1.5 }}>
                <EditBase resource="tasks"
                    id={taskId}
                    mutationOptions={{
                        onSuccess: () => {
                            close();
                            notify('Task updated', {
                                type: 'info',
                                undoable: true,
                            });
                        },
                    }}
                    redirect={false}>
                    <Form>
                        <Stack gap={2}>
                            <TextInput source="text" label="Description" validate={required()} multiline sx={{ margin: 0 }} helperText={false} />
                            <SelectInput source="type" label="Type" choices={taskTypes} validate={required()} />
                            <DateInput source="due_date" label="Due date" validate={required()} />
                        </Stack>
                        <DialogActions sx={{ p: 0, pt: 2, borderTop: '1px solid #e0e7ef', mt: 2 }}>
                            <Toolbar sx={{ width: '100%', justifyContent: 'space-between', gap: 1 }}>
                                <SaveButton label="Save" />
                                <DeleteButton
                                    label="Delete"
                                    mutationOptions={{
                                        onSuccess: () => {
                                            close();
                                            notify('Task deleted', {
                                                type: 'info',
                                                undoable: true,
                                            });
                                        },
                                    }}
                                    redirect={false}
                                />
                            </Toolbar>
                        </DialogActions>
                    </Form>
                </EditBase>
            </DialogContent>
        </Dialog>
    );
};
