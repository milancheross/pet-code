export type Species = 'pas' | 'macka' | 'zec' | 'ptica' | 'ostalo'
export type QrStatus = 'unused' | 'active' | 'disabled'
export type OrderStatus = 'nova' | 'potvrdjena' | 'poslata' | 'isporucena'

export interface QrCode {
  id: string; code: string; status: QrStatus
  created_at: string; activated_at: string | null
}
export interface Owner {
  id: string; name: string | null; phone: string | null; created_at: string
}
export interface Pet {
  id: string; qr_code_id: string; owner_id: string
  name: string; species: Species; breed: string | null
  photo_url: string | null; locked_at: string
  color: string | null; age: string | null; microchip: string | null
  vaccinated: boolean | null; allergies: string | null
  medication: string | null; vet_info: string | null
  note: string | null; is_lost: boolean
  created_at: string; updated_at: string
}
export interface HealthRecord {
  id: string; pet_id: string; title: string
  note: string | null; vet_name: string | null
  record_date: string; created_at: string
}
export interface Order {
  id: string; customer_name: string; customer_phone: string
  customer_email: string | null; address: string; city: string
  quantity: number; note: string | null
  status: OrderStatus; total_rsd: number; created_at: string
}
export interface PetFull extends Pet {
  qr_codes: QrCode; owners: Owner; health_records: HealthRecord[]
}

export const SPECIES_EMOJI: Record<Species, string> = {
  pas: '🐕', macka: '🐈', zec: '🐇', ptica: '🦜', ostalo: '🐾',
}
export const PRICE_PER_TAG = 990
