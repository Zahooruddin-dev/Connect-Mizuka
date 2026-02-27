import React, { createContext, useContext, useState } from 'react';

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

	function login(userData, tokenValue) {
		setUser(userData);
		setToken(tokenValue);
		localStorage.setItem('mizuka_user', JSON.stringify(userData));
		localStorage.setItem('mizuka_token', tokenValue);

		if (userData.institute_id) {
			const existing = JSON.parse(
				localStorage.getItem('mizuka_institutes') || '[]',
			);
			const alreadyHas = existing.find((i) => i.id === userData.institute_id);
			if (!alreadyHas) {
				const updated = [
					...existing,
					{ id: userData.institute_id, label: userData.institute_id },
				];
				setInstitutes(updated);
				localStorage.setItem('mizuka_institutes', JSON.stringify(updated));
				const active = {
					id: userData.institute_id,
					label: userData.institute_id,
				};
				setActiveInstituteState(active);
				localStorage.setItem('mizuka_active_institute', JSON.stringify(active));
			} else {
				setInstitutes(existing);
				if (!activeInstitute) {
					setActiveInstituteState(existing[0]);
					localStorage.setItem(
						'mizuka_active_institute',
						JSON.stringify(existing[0]),
					);
				}
			}
		}
	}

	function logout() {
		setUser(null);
		setToken(null);
		setInstitutes([]);
		setActiveInstituteState(null);
		localStorage.removeItem('mizuka_user');
		localStorage.removeItem('mizuka_token');
		localStorage.removeItem('mizuka_institutes');
		localStorage.removeItem('mizuka_active_institute');
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

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				institutes,
				activeInstitute,
				login,
				logout,
				addInstitute,
				removeInstitute,
				setActiveInstitute,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
