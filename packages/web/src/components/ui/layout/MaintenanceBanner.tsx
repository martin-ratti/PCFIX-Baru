import React, { useEffect, useState } from "react";
import { AlertTriangleIcon } from "../../SharedIcons"; // 👇 Import
import { API_URL } from "../../../utils/api";

export default function MaintenanceBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        async function checkMaintenanceStatus() {
            try {
                const res = await fetch(`${API_URL}/config`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && json.data?.maintenanceMode) {
                        // Check Admin
                        let isAdmin = false;
                        try {
                            const storage = localStorage.getItem("auth-storage");
                            if (storage) {
                                const parsed = JSON.parse(storage);
                                if (parsed.state?.user?.role === "ADMIN") isAdmin = true;
                            }
                        } catch (e) { }

                        if (isAdmin) {
                            setIsVisible(true);
                        }
                    }
                }
            } catch (e) { }
        }
        checkMaintenanceStatus();
    }, []);

    if (!isVisible) return null;

    return (
        <div
            id="maintenance-alert"
            className="w-full h-12 flex items-center justify-center shadow-md relative overflow-hidden"
            style={{
                backgroundImage:
                    "repeating-linear-gradient(-45deg, #000, #000 20px, #fbbf24 20px, #fbbf24 40px)",
            }}
        >
            <div className="bg-black/90 text-yellow-400 px-6 py-1 rounded-full font-black text-sm uppercase tracking-widest shadow-lg border-2 border-yellow-400 z-10 animate-pulse flex items-center gap-2">
                <AlertTriangleIcon className="w-5 h-5" /> Sitio en Mantenimiento{" "}
                <AlertTriangleIcon className="w-5 h-5" />
            </div>
        </div>
    );
}
