import axios from "axios";
import type { Province, Ward } from "@/types/province.type";

const LOCATION_SERVICE_BASE_URL =
  import.meta.env.VITE_LOCATION_SERVICE_URL || "http://localhost:9999";

const API_V1_URL = `${LOCATION_SERVICE_BASE_URL}/api/v1`;

let cachedProvinces: Province[] | null = null;
let provincesPromise: Promise<Province[]> | null = null;
const cachedWardsByProvince: Record<string, Ward[]> = {};

const provinceService = {
  async getProvinces(): Promise<Province[]> {
    if (cachedProvinces && cachedProvinces.length > 0) {
      return cachedProvinces;
    }
    if (provincesPromise) {
      return provincesPromise;
    }

    provincesPromise = axios
      .get<Province[]>(`${API_V1_URL}/provinces`, { timeout: 2500 })
      .then((response) => {
        cachedProvinces = response.data ?? [];
        return cachedProvinces;
      })
      .finally(() => {
        provincesPromise = null;
      });

    return provincesPromise;
  },

  async getWardsByProvince(provinceCode: string | number): Promise<Ward[]> {
    const key = String(provinceCode).padStart(2, "0");
    if (cachedWardsByProvince[key]?.length) {
      return cachedWardsByProvince[key];
    }

    const response = await axios.get<Ward[]>(`${API_V1_URL}/provinces/${key}/wards`, {
      timeout: 2500,
    });
    cachedWardsByProvince[key] = response.data ?? [];
    return cachedWardsByProvince[key];
  },
};

export default provinceService;
