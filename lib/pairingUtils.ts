/**
 * 同じ物件名で売却・購入の両方が存在する「両手」ペア情報を構築する。
 *
 * @param cases propertyName / type / stage を持つ配列（SellCase, BuyCase, UnifiedCase いずれでも可）
 * @returns caseId → { partnerType, partnerStage } のMap
 */
export function buildBothHandsMap(
  cases: Array<{ id: string; propertyName: string; type: string; stage: string }>
): Map<string, { partnerType: string; partnerStage: string }> {
  const result = new Map<string, { partnerType: string; partnerStage: string }>()
  for (const c of cases) {
    if (!c.propertyName) continue
    const partner = cases.find(p => p.propertyName === c.propertyName && p.type !== c.type)
    if (partner) {
      result.set(c.id, { partnerType: partner.type, partnerStage: partner.stage })
    }
  }
  return result
}
