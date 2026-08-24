export interface Province {
  code: string | number;
  name: string;
  full_name?: string;
  type?: string;
  type_name?: string;
  division_type?: string;
  codename?: string;
  phone_code?: number;
}

export interface Ward {
  code: string | number;
  name: string;
  full_name?: string;
  type?: string;
  type_name?: string;
  division_type?: string;
  codename?: string;
  province_code?: string | number;
}
