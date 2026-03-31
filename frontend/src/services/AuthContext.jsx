import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(() => {
		const stored = localStorage.getItem('mizuka_user');
		return stored ? JSON.parse(stored) : null;
	});

	const [token, setToken] = useState(
		() => localStorage.getItem('mizuka_token') || null,
	);

	const [institutes, setInstitutes] = useState(() => {
		const stored = localStorage.getItem('mizuka_institutes');
		return stored ? JSON.parse(stored) : [];
	});

	const [activeInstitute, setActiveInstituteState] = useState(() => {
		const stored = localStorage.getItem('mizuka_active_institute');
		return stored ? JSON.parse(stored) : null;
	});

	const clearSession = useCallback(() => {
		setUser(null);
		setToken(null);
		setInstitutes([]);
		setActiveInstituteState(null);
		localStorage.removeItem('mizuka_user');
		localStorage.removeItem('mizuka_token');
		localStorage.removeItem('mizuka_institutes');
		localStorage.removeItem('mizuka_active_institute');
	}, []);

	useEffect(() => {
		const storedToken = localStorage.getItem('mizuka_token');
		if (!storedToken) return;

		fetch(
			`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/user-info`,
			{
				headers: { Authorization: `Bearer ${storedToken}` },
			},
		)
			.then((r) => {
				if (!r.ok) {
					clearSession();
					return null;
				}
				return r.json();
			})
			.then((data) => {
				if (!data?.user) return;
				setUser((prev) => {
					const merged = { ...(prev || {}), ...data.user };
					localStorage.setItem('mizuka_user', JSON.stringify(merged));
					return merged;
				});
			})
			.catch(() => {
				clearSession();
			});
	}, [clearSession]);

	useEffect(() => {
		const handleExpired = () => clearSession();
		window.addEventListener('mizuka:session-expired', handleExpired);
		return () =>
			window.removeEventListener('mizuka:session-expired', handleExpired);
	}, [clearSession]);

	function login(userData, tokenValue) {
		setUser(userData);
		setToken(tokenValue);
		localStorage.setItem('mizuka_user', JSON.stringify(userData));
		localStorage.setItem('mizuka_token', tokenValue);

		if (Array.isArray(userData.memberships)) {
			const items = userData.memberships.map((m) => ({
				id: m.id,
				label: m.name || m.id,
				role: m.role,
			}));
			setInstitutes(items);
			localStorage.setItem('mizuka_institutes', JSON.stringify(items));
			if (items.length > 0) {
				setActiveInstituteState(items[0]);
				localStorage.setItem(
					'mizuka_active_institute',
					JSON.stringify(items[0]),
				);
			}
		}
	}

	function updateUser(fields) {
		setUser((prev) => {
			const updated = { ...prev, ...fields };
			localStorage.setItem('mizuka_user', JSON.stringify(updated));
			return updated;
		});
	}

	function logout() {
		clearSession();
	}

	function addInstitute(institute) {
		setInstitutes((prev) => {
			const already = prev.find((i) => i.id === institute.id);
			if (already) return prev;
			const updated = [...prev, institute];
			localStorage.setItem('mizuka_institutes', JSON.stringify(updated));
			return updated;
		});
		if (!activeInstitute) {
			setActiveInstituteState(institute);
			localStorage.setItem(
				'mizuka_active_institute',
				JSON.stringify(institute),
			);
		}
	}

	function removeInstitute(instituteId) {
		setInstitutes((prev) => {
			const updated = prev.filter((i) => i.id !== instituteId);
			localStorage.setItem('mizuka_institutes', JSON.stringify(updated));
			return updated;
		});
		if (activeInstitute?.id === instituteId) {
			const remaining = institutes.filter((i) => i.id !== instituteId);
			const next = remaining.length > 0 ? remaining[0] : null;
			setActiveInstituteState(next);
			localStorage.setItem('mizuka_active_institute', JSON.stringify(next));
		}
	}

	function setActiveInstitute(institute) {
		setActiveInstituteState(institute);
		localStorage.setItem('mizuka_active_institute', JSON.stringify(institute));
	}

	function isActiveAdmin() {
		if (!activeInstitute) return false;
		const record = institutes.find((i) => i.id === activeInstitute.id);
		return record?.role === 'admin';
	}

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				institutes,
				activeInstitute,
				login,
				logout,
				updateUser,
				addInstitute,
				removeInstitute,
				setActiveInstitute,
				isActiveAdmin,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
