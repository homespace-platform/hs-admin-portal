import type {
  BillingMethod,
  ChargeType,
  DayOfWeek,
  DepositType,
  ListingCategory,
  PaymentCycle,
  PriceUnit,
  ViewingSlot,
} from "@/types/listing.type";

export const CATEGORY_NAMES: Record<ListingCategory, string> = {
  APARTMENT: "Căn hộ / Chung cư",
  HOUSE: "Nhà ở nguyên căn",
  OFFICE: "Văn phòng cho thuê",
  COMMERCIAL_SPACE: "Mặt bằng kinh doanh",
  ROOM: "Nhà trọ / Phòng cho thuê",
};

export const SUBTYPE_NAMES: Record<string, string> = {
  // Căn hộ
  APARTMENT_STANDARD: "Căn hộ tiêu chuẩn",
  APARTMENT_STUDIO: "Căn hộ Studio",
  APARTMENT_DUPLEX: "Căn hộ Duplex",
  APARTMENT_PENTHOUSE: "Penthouse cao cấp",
  APARTMENT_OFFICETEL: "Căn hộ Officetel",
  APARTMENT_SERVICE: "Căn hộ dịch vụ",
  APARTMENT_OTHER: "Căn hộ khác",

  // Nhà nguyên căn
  HOUSE_TOWNHOUSE: "Nhà phố liền kề",
  HOUSE_ALLEY: "Nhà trong ngõ / hẻm",
  HOUSE_VILLA: "Biệt thự / Villa",
  HOUSE_GRADE_4: "Nhà cấp 4",
  HOUSE_LEVEL4: "Nhà cấp 4",
  HOUSE_OTHER: "Nhà ở khác",

  // Văn phòng
  OFFICE_TRADITIONAL: "Văn phòng truyền thống",
  OFFICE_SERVICED: "Văn phòng trọn gói (Serviced)",
  OFFICE_COWORKING: "Không gian làm việc chung (Co-working)",
  OFFICE_SHARED: "Văn phòng chia sẻ",
  OFFICE_OTHER: "Văn phòng khác",

  // Mặt bằng kinh doanh
  COMMERCIAL_STORE: "Cửa hàng bán lẻ",
  COMMERCIAL_KIOSK: "Ki-ốt kinh doanh",
  COMMERCIAL_SHOWROOM: "Showroom trưng bày",
  COMMERCIAL_SHOPHOUSE: "Shophouse khối đế",
  COMMERCIAL_MALL: "Mặt bằng trung tâm thương mại",
  COMMERCIAL_STREET_HOUSE: "Mặt bằng nhà mặt phố",
  COMMERCIAL_SHOP: "Kiot / Cửa hàng",
  COMMERCIAL_OTHER: "Mặt bằng khác",

  // Nhà trọ / Phòng cho thuê
  ROOM_BOARDING: "Phòng trọ sinh viên / công nhân",
  ROOM_IN_HOUSE: "Phòng trong nhà nguyên căn",
  ROOM_HOMESTAY: "Phòng homestay",
  ROOM_SERVICED_APARTMENT: "Căn hộ dịch vụ",
  ROOM_SERVICED: "Phòng dịch vụ cao cấp",
  ROOM_DORMITORY: "Ký túc xá / Giường tầng (Sleepbox)",
  ROOM_OTHER: "Phòng trọ khác",
};

export const RENTAL_MODE_NAMES: Record<string, string> = {
  WHOLE_UNIT: "Cho thuê nguyên căn / toàn bộ",
  WHOLE: "Cho thuê nguyên căn / toàn bộ",
  PARTIAL: "Cho thuê một phần",
  PRIVATE_ROOM: "Phòng riêng biệt",
  SHARED_ROOM: "Ở ghép",
  WHOLE_FLOOR: "Nguyên sàn / Diện tích lớn",
  PRIVATE_OFFICE: "Phòng làm việc riêng",
  HOT_DESK: "Chỗ ngồi làm việc / Coworking",
  KIOSK: "Ki-ốt / Quầy kinh doanh",
};

export const DIRECTION_NAMES: Record<string, string> = {
  EAST: "Đông",
  WEST: "Tây",
  SOUTH: "Nam",
  NORTH: "Bắc",
  SOUTH_EAST: "Đông Nam",
  NORTH_EAST: "Đông Bắc",
  SOUTH_WEST: "Tây Nam",
  NORTH_WEST: "Tây Bắc",
};

export const LEGAL_STATUS_NAMES: Record<string, string> = {
  PENDING: "Đang chờ cấp sổ",
  PINK_BOOK: "Sổ hồng / Sổ đỏ",
  CONTRACT: "Hợp đồng mua bán / Hợp đồng thuê",
  OTHER: "Giấy tờ hợp lệ khác",
};

export const FURNISHING_NAMES: Record<string, string> = {
  RAW: "Bàn giao thô (chưa có nội thất)",
  UNFURNISHED: "Bàn giao thô (chưa có nội thất)",
  BASIC: "Nội thất cơ bản",
  FULL: "Đầy đủ nội thất",
  FULLY_FURNISHED: "Đầy đủ nội thất",
  LUXURY: "Nội thất cao cấp",
  PARTIALLY_FURNISHED: "Nội thất một phần",
};

export const OFFICE_GRADE_NAMES: Record<string, string> = {
  GRADE_A: "Hạng A cao cấp",
  GRADE_B: "Hạng B",
  GRADE_C: "Hạng C",
  ECONOMY: "Văn phòng giá rẻ / Tòa nhà tư nhân",
};

export const HANDOVER_STATUS_NAMES: Record<string, string> = {
  RAW: "Bàn giao thô (sàn bê tông, trần thô)",
  BASIC: "Hoàn thiện cơ bản (trần, sàn, chiếu sáng, điều hòa)",
  FULL: "Đầy đủ nội thất (bàn ghế, tủ, vách ngăn)",
  FINISHED: "Đã hoàn thiện, sẵn sàng kinh doanh / sử dụng",
};

export const COMMERCIAL_POSITION_NAMES: Record<string, string> = {
  GROUND_FLOOR: "Mặt đất / Tầng trệt",
  GROUND_LEVEL: "Mặt đất / Tầng trệt",
  UPPER_FLOOR: "Tầng lầu",
  SHOPPING_MALL: "Trong trung tâm thương mại / Phức hợp",
  MALL_SPACE: "Trong trung tâm thương mại / Phức hợp",
  MALL: "Trong trung tâm thương mại / Phức hợp",
  OTHER: "Vị trí khác",
};

export const PARKING_NAMES: Record<string, string> = {
  NONE: "Không có chỗ để xe riêng",
  MOTORBIKE: "Chỗ để xe máy",
  CAR: "Chỗ đỗ ô tô",
  BOTH: "Cả xe máy và ô tô",
  MOTORBIKE_AND_CAR: "Cả xe máy và ô tô",
  FREE: "Miễn phí",
  PAID: "Có thu phí",
};

export const ACCESS_TYPE_NAMES: Record<string, string> = {
  PRIVATE: "Lối đi riêng biệt hoàn toàn",
  SHARED: "Lối đi chung",
};

export const RESTROOM_TYPE_NAMES: Record<string, string> = {
  PRIVATE: "Vệ sinh khép kín riêng",
  SHARED: "Vệ sinh chung ngoài phòng / tầng",
};

export const KITCHEN_TYPE_NAMES: Record<string, string> = {
  PRIVATE: "Kệ bếp riêng trong phòng",
  SHARED: "Khu bếp chung",
  NONE: "Không cho nấu ăn / Không có bếp",
};

export const OPERATING_MODE_NAMES: Record<string, string> = {
  ALWAYS_OPEN: "Tự do 24/7 (Không giới hạn)",
  FLEXIBLE: "Tự do giờ giấc (24/7)",
  FREE: "Tự do giờ giấc (24/7)",
  CURFEW: "Có giờ giới nghiêm / Giờ đóng cửa",
  CUSTOM_SCHEDULE: "Theo lịch hoạt động quy định",
};

export const METER_TYPE_NAMES: Record<string, string> = {
  PRIVATE: "Đồng hồ công tơ riêng",
  SHARED: "Dùng chung đồng hồ",
};

export const CHARGE_TYPE_NAMES: Record<ChargeType | string, string> = {
  ELECTRICITY: "Tiền điện",
  WATER: "Tiền nước",
  MANAGEMENT: "Phí quản lý tòa nhà",
  INTERNET: "Internet / WiFi",
  SERVICE_OR_GARBAGE: "Phí vệ sinh & Rác",
  MOTORBIKE_PARKING: "Phí gửi xe máy",
  CAR_PARKING: "Phí gửi ô tô",
  OVERTIME_AIR_CONDITIONING: "Điều hòa ngoài giờ",
  OTHER: "Khoản phí khác",
};

export const BILLING_METHOD_NAMES: Record<BillingMethod | string, string> = {
  PER_KWH: "kWh",
  STATE_WATER_RATE: "theo giá nhà nước / EVN",
  PER_M3: "m³",
  PER_PERSON_MONTH: "người / tháng",
  PER_MONTH: "tháng",
  PER_M2_MONTH: "m² / tháng",
  PER_VEHICLE_MONTH: "xe / tháng",
  PER_HOUR: "giờ",
  FREE: "Miễn phí",
  INCLUDED: "Đã bao gồm trong giá thuê",
  NOT_APPLICABLE: "Không áp dụng",
  NEGOTIABLE: "Thương lượng",
  CUSTOM: "Tùy chỉnh",
};

export const PRICING_UNIT_NAMES: Record<PriceUnit | string, string> = {
  MONTH: "tháng",
  VND_MONTH: "tháng",
  M2_MONTH: "m² / tháng",
  VND_M2_MONTH: "m² / tháng",
  SEAT_MONTH: "chỗ ngồi / tháng",
  VND_SEAT_MONTH: "chỗ ngồi / tháng",
  ROOM_MONTH: "phòng / tháng",
  VND_ROOM_MONTH: "phòng / tháng",
  PERSON_MONTH: "người / tháng",
  VND_PERSON_MONTH: "người / tháng",
};

export const DEPOSIT_TYPE_NAMES: Record<DepositType | string, string> = {
  NONE: "Không đặt cọc",
  FIXED_AMOUNT: "Cọc cố định theo số tiền",
  AMOUNT: "Cọc cố định theo số tiền",
  MONTH_COUNT: "Cọc theo số tháng tiền thuê",
  MONTHS: "Cọc theo số tháng tiền thuê",
  NEGOTIABLE: "Thương lượng / Thỏa thuận",
  NEGOTIATE: "Thương lượng / Thỏa thuận",
};

export const PAYMENT_CYCLE_NAMES: Record<PaymentCycle | string, string> = {
  MONTHLY: "Thanh toán từng tháng",
  EVERY_2_MONTHS: "Thanh toán mỗi 2 tháng",
  TWO_MONTHS: "Thanh toán mỗi 2 tháng",
  QUARTERLY: "Thanh toán mỗi quý (3 tháng)",
  EVERY_6_MONTHS: "Thanh toán mỗi 6 tháng",
  HALF_YEAR: "Thanh toán mỗi 6 tháng",
  YEARLY: "Thanh toán 12 tháng / lần",
  EVERY_YEAR: "Thanh toán 12 tháng / lần",
  NEGOTIABLE: "Linh hoạt / Thỏa thuận",
  NEGOTIATE: "Linh hoạt / Thỏa thuận",
};

export const DAY_LABELS: Record<DayOfWeek | string, string> = {
  MONDAY: "Thứ 2",
  TUESDAY: "Thứ 3",
  WEDNESDAY: "Thứ 4",
  THURSDAY: "Thứ 5",
  FRIDAY: "Thứ 6",
  SATURDAY: "Thứ 7",
  SUNDAY: "Chủ nhật",
};

export const SLOT_LABELS: Record<ViewingSlot | string, string> = {
  MORNING: "Buổi sáng (08:00 – 12:00)",
  AFTERNOON: "Buổi chiều (13:00 – 17:00)",
  EVENING: "Buổi tối (18:00 – 21:00)",
};

/**
 * Format hiển thị giá dịch vụ / khoản phí hàng tháng
 */
export function formatChargeFee(
  charge: {
    includedInRent?: boolean | null;
    amount?: number | null;
    billingMethod?: string | null;
  },
  formatCurrencyFn: (amount?: number | null) => string
): string {
  if (charge.includedInRent) {
    return "Đã bao gồm trong giá thuê";
  }
  if (!charge.billingMethod) {
    return charge.amount ? `${formatCurrencyFn(charge.amount)} ₫` : "—";
  }
  if (charge.billingMethod === "STATE_WATER_RATE") {
    return "Theo giá quy định nhà nước / EVN";
  }
  if (charge.billingMethod === "FREE" || charge.billingMethod === "INCLUDED") {
    return "Miễn phí / Đã bao gồm";
  }
  if (charge.billingMethod === "NOT_APPLICABLE") {
    return "Không áp dụng";
  }
  if (charge.billingMethod === "NEGOTIABLE") {
    return "Thỏa thuận";
  }

  const unit = BILLING_METHOD_NAMES[charge.billingMethod] || charge.billingMethod;
  if (charge.amount != null && charge.amount > 0) {
    return `${formatCurrencyFn(charge.amount)} ₫ / ${unit}`;
  }
  return unit;
}
