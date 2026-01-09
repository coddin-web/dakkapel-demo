export type RoofColor = 'zwart' | 'oranje-rood'

export type DormerModel = 'standaard' | 'kader' | 'klassiek' | 'nokverhoging'

export type DormerRoofType = 'plat' | 'schuin'

export type ElementType = 'geen' | 'raam' | 'draai-kiepraam' | 'tussenpaneel'

export type PanelMaterial = 'gladde-plaat' | 'keraliet' | 'zink' | 'hout'

export type FrameMaterial = 'kunststof' | 'hout'

export type ColorOption = 'wit' | 'cremewit' | 'antraciet' | 'zwart' | 'groen' | 'zink' | 'anders'

export interface DormerElement {
  position: number
  type: ElementType
}

export interface CustomColor {
  type: ColorOption
  ralCode?: string
}

export interface PriceBreakdown {
  base: number
  model: number
  dormerRoof: number
  width: number
  height: number
  elements: number
  panelMaterial: number
  frameMaterial: number
  rolluiken: number
  customColors: number
  total: number
}

export const RAL_COLORS: Record<ColorOption, { name: string; code?: string; hex: string }> = {
  'wit': { name: 'Wit', code: 'RAL 9010', hex: '#FFFFFF' },
  'cremewit': { name: 'Crèmewit', code: 'RAL 9001', hex: '#FDF4E3' },
  'antraciet': { name: 'Antraciet', code: 'RAL 7016', hex: '#293133' },
  'zwart': { name: 'Zwart', code: 'RAL 9005', hex: '#0A0A0A' },
  'groen': { name: 'Groen', code: 'RAL 6009', hex: '#31372B' },
  'zink': { name: 'Zink met felsbanen', hex: '#8A8D8F' },
  'anders': { name: 'Anders (vrije RAL)', hex: '#CCCCCC' }
}

export const MODEL_LABELS: Record<DormerModel, string> = {
  'standaard': 'Standaard model',
  'kader': 'Kadermodel',
  'klassiek': 'Klassiek model',
  'nokverhoging': 'Nokverhoging'
}

export const DORMER_ROOF_LABELS: Record<DormerRoofType, string> = {
  'plat': 'Plat dak',
  'schuin': 'Schuin dak (pannendak)'
}

export const ELEMENT_LABELS: Record<ElementType, string> = {
  'geen': 'Geen element',
  'raam': 'Raam (vast)',
  'draai-kiepraam': 'Draai-kiepraam (80cm)',
  'tussenpaneel': 'Tussenpaneel'
}

export const PANEL_MATERIAL_LABELS: Record<PanelMaterial, string> = {
  'gladde-plaat': 'Gladde plaat',
  'keraliet': 'Keraliet',
  'zink': 'Zink met felsbanen',
  'hout': 'Hout'
}

export const FRAME_MATERIAL_LABELS: Record<FrameMaterial, string> = {
  'kunststof': 'Kunststof',
  'hout': 'Hout'
}
