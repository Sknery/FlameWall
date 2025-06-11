// frontend/src/pages/AdminPage.js

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    Box, Typography, Sheet, Table, Input, CircularProgress, Alert, Chip, Button,
    Modal, ModalDialog, ModalClose, Select, Option, FormControl, FormLabel,
    // --- Новый импорт для расположения кнопок ---
    Stack, Tooltip, // <-- ДОБАВЬТЕ ЭТО
} from '@mui/joy';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block'; // Иконка для бана
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // Иконка для разбана
import { Ranks } from '../constants/enums';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function AdminPage() {
    const { authToken } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRank, setSelectedRank] = useState('');

    const fetchUsers = useCallback(async (query) => {
        setLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${authToken}` },
                params: { search: query },
            };
            const response = await axios.get(`${API_BASE_URL}/users`, config);
            setUsers(response.data);
        } catch (err) {
            setError('Failed to load user data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchUsers('');
    }, [fetchUsers]);

    const handleSearch = (event) => {
        if (event.key === 'Enter') {
            fetchUsers(searchQuery);
        }
    };

    const handleOpenModal = (user) => {
        setSelectedUser(user);
        setSelectedRank(user.rank);
        setIsModalOpen(true);
    };

    const handleSaveChanges = async () => {
        if (!selectedUser) return;
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            await axios.patch(
                `${API_BASE_URL}/admin/users/${selectedUser.id}/update`,
                { rank: selectedRank },
                config
            );
            setIsModalOpen(false);
            fetchUsers(searchQuery);
        } catch (err) {
            alert('Failed to update user.');
            console.error(err);
        }
    };

    // --- НОВЫЙ ОБРАБОТЧИК ДЛЯ БАНА/РАЗБАНА ---
    const handleToggleBanStatus = async (user) => {
        const action = user.is_banned ? 'unban' : 'ban';
        if (!window.confirm(`Are you sure you want to ${action} ${user.username}?`)) {
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            await axios.post(`${API_BASE_URL}/admin/users/${user.id}/${action}`, {}, config);
            fetchUsers(searchQuery); // Обновляем список
        } catch (err) {
            alert(`Failed to ${action} user.`);
            console.error(err);
        }
    };

    if (error) {
        return <Alert color="danger">{error}</Alert>;
    }

    return (
        <Box>
            <Typography level="h1" component="h1" sx={{ mb: 3 }}>
                User Management
            </Typography>

            <Input
                sx={{ mb: 2, maxWidth: '400px' }}
                placeholder="Search by username and press Enter..."
                startDecorator={<SearchIcon />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
            />

            <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'auto' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Table hoverRow>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Rank</th>
                                <th>Reputation</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>
                                        <Tooltip title={user.username} variant="outlined" size="sm">
                                            <Typography
                                                sx={{
                                                    // Стили для обрезки текста
                                                    maxWidth: '160px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {user.username}
                                            </Typography>
                                        </Tooltip>
                                    </td>
                                    <td>
                                        <Tooltip title={user.email} variant="outlined" size="sm">
                                            <Typography
                                                sx={{
                                                    // Стили для обрезки текста
                                                    maxWidth: '200px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {user.email}
                                            </Typography>
                                        </Tooltip>
                                    </td>
                                    <td><Chip size="sm" color="primary">{user.rank}</Chip></td>
                                    <td>{user.reputation_count}</td>
                                    <td>
                                        {user.is_banned ? (
                                            <Chip size="sm" color="danger">Banned</Chip>
                                        ) : (
                                            <Chip size="sm" color="success">Active</Chip>
                                        )}
                                    </td>
                                    <td style={{ minWidth: 120 }}>
                                        <Stack direction="column" spacing={1}>
                                            <Button
                                                size="sm"
                                                variant="outlined"
                                                color="neutral"
                                                startDecorator={<EditIcon />}
                                                onClick={() => handleOpenModal(user)}
                                            >
                                                Edit
                                            </Button>
                                            {user.is_banned ? (
                                                <Button
                                                    size="sm"
                                                    variant="soft"
                                                    color="success"
                                                    startDecorator={<CheckCircleOutlineIcon />}
                                                    onClick={() => handleToggleBanStatus(user)}
                                                >
                                                    Unban
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="soft"
                                                    color="danger"
                                                    startDecorator={<BlockIcon />}
                                                    onClick={() => handleToggleBanStatus(user)}
                                                >
                                                    Ban
                                                </Button>
                                            )}
                                        </Stack>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Sheet>

            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ModalDialog>
                    <ModalClose />
                    <Typography level="h4">Edit User: {selectedUser?.username}</Typography>
                    <FormControl sx={{ mt: 2 }}>
                        <FormLabel>Rank</FormLabel>
                        <Select
                            value={selectedRank}
                            onChange={(e, newValue) => setSelectedRank(newValue)}
                        >
                            {Object.values(Ranks).map(rank => (
                                <Option key={rank} value={rank}>{rank}</Option>
                            ))}
                        </Select>
                    </FormControl>
                    <Button sx={{ mt: 3 }} onClick={handleSaveChanges}>
                        Save Changes
                    </Button>
                </ModalDialog>
            </Modal>
        </Box>
    );
}

export default AdminPage;