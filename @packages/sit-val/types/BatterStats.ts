export interface BatterStatsData {
  bb: number;
  '1B': number;
  '2B': number;
  '3B': number;
  hr: number;
  so: number;
  go: number;
  fo: number;
  sf: number;
  sh: number;
  hbp: number;
  pa?: number;
  [key: string]: any;
}

export class BatterStats implements Omit<BatterStatsData, 'pa'> {
  bb: number = 0;
  '1B': number = 0;
  '2B': number = 0;
  '3B': number = 0;
  hr: number = 0;
  so: number = 0;
  go: number = 0;
  fo: number = 0;
  sf: number = 0;
  sh: number = 0;
  hbp: number = 0;

  private _pa: number | null = null;

  constructor(init?: Partial<BatterStats>) {
    if (init) {
      Object.assign(this, init);
    }
  }

  // pa 호출 시 계산 및 캐싱
  get pa(): number {
    if (this._pa === null) {
      this._pa = (this.bb || 0) + (this['1B'] || 0) + (this['2B'] || 0) + 
                 (this['3B'] || 0) + (this.hr || 0) + (this.so || 0) + 
                 (this.go || 0) + (this.fo || 0) + (this.hbp || 0) + 
                 (this.sh || 0);
    }
    return this._pa;
  }

  // 동적 키 접근을 위한 인덱스 시그니처
  [key: string]: any;
}