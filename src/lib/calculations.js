/**
 * PV Row Spacing Planner - Calculation Utilities
 */

export const toRadians = (deg) => deg * Math.PI / 180;
export const toDegrees = (rad) => rad * 180 / Math.PI;

/**
 * 太陽位置（高度・方位）を計算する
 * 簡易計算モデル（冬至 12月22日頃を想定）
 * 北=0, 東=90, 南=180, 西=270
 */
export const calculateSolarPosition = (lat, lon, hour) => {
  const DECLINATION = -23.44; // 冬至の赤緯 [deg]
  const EQ_OF_TIME = 0; 
  
  const latRad = toRadians(lat);
  const decRad = toRadians(DECLINATION);
  
  const timeOffset = (lon - 135) / 15;
  const solarTime = hour + timeOffset + (EQ_OF_TIME / 60);
  const t = (solarTime - 12) * 15; 
  const tRad = toRadians(t);
  
  const sinH = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(tRad);
  const hRad = Math.asin(Math.max(-1, Math.min(1, sinH)));
  const hDeg = toDegrees(hRad);
  
  let azDeg;
  if (hDeg < 0) {
      azDeg = 0; // 夜
  } else {
      // sin(A) = cos(dec) * sin(t) / cos(h)
      // cos(A) = (sin(h) * sin(lat) - sin(dec)) / (cos(h) * cos(lat))
      const sinA = (Math.cos(decRad) * Math.sin(tRad)) / Math.cos(hRad);
      const cosA = (Math.sin(hRad) * Math.sin(latRad) - Math.sin(decRad)) / (Math.cos(hRad) * Math.cos(latRad));
      
      const azRad = Math.atan2(sinA, cosA); 
      azDeg = toDegrees(azRad) + 180; // 北基準(0)にするため+180
  }
  
  return {
    altitudeDeg: Math.max(0, hDeg),
    azimuthDeg: azDeg
  };
};

/**
 * パネル上端のGL高さを計算
 */
export const calculateTopGLHeight = ({
  panelLengthMm,
  verticalCount,
  tiltDeg,
  bottomClearanceMm,
}) => {
  if (panelLengthMm <= 0 || verticalCount <= 0 || bottomClearanceMm < 0) return 0;

  const totalLengthM = (panelLengthMm * verticalCount) / 1000;
  const tiltRad = toRadians(tiltDeg);
  const relativeHeightM = totalLengthM * Math.sin(tiltRad);
  const bottomM = bottomClearanceMm / 1000;

  return bottomM + relativeHeightM;
};

/**
 * [非推奨] 旧: 影の長さを計算 (真南前提)
 * ※互換性のために残すが、今後は calculateRowShadow を使用する
 */
export const calculateShadowLength = (topGLHeightM, sunAltitudeDeg) => {
  if (sunAltitudeDeg <= 0) return Infinity; 
  if (topGLHeightM <= 0) return 0;

  const sunAltitudeRad = toRadians(sunAltitudeDeg);
  return topGLHeightM / Math.tan(sunAltitudeRad);
};

/**
 * 行方向の影長を計算（方位角考慮）
 * 
 * @param {number} topGLHeightM - パネル上端GL高さ [m]
 * @param {number} sunAltitudeDeg - 太陽高度 [deg]
 * @param {number} sunAzimuthDeg - 太陽方位 [deg] (北=0)
 * @param {number} panelAzimuthDeg - パネル方位 [deg] (北=0)
 */
export const calculateRowShadow = (topGLHeightM, sunAltitudeDeg, sunAzimuthDeg, panelAzimuthDeg) => {
  const sunAltRad = toRadians(sunAltitudeDeg);
  
  // 基本的な影の長さ (L_basic)
  let lBasic = 0;
  if (sunAltitudeDeg <= 0) {
      lBasic = Infinity;
  } else if (topGLHeightM > 0) {
      lBasic = topGLHeightM / Math.tan(sunAltRad);
  }

  // 方位差 (Delta A)
  const deltaDeg = sunAzimuthDeg - panelAzimuthDeg;
  const deltaRad = toRadians(deltaDeg);
  const cosDelta = Math.cos(deltaRad);

  // 背面日射判定
  // cos(Delta) <= 0 の場合、太陽はパネルの背面側、または真横にあるため、
  // 前列パネルは後列パネル（行方向）に対して影を落とさないとみなす
  if (cosDelta <= 0 || sunAltitudeDeg <= 0) {
      return {
          lBasic: lBasic,
          lRow: 0,
          isBackside: true,
          azimuthDiffDeg: deltaDeg
      };
  }

  // 行方向の影成分 (L_row)
  const lRow = lBasic * cosDelta;

  return {
      lBasic: lBasic,
      lRow: lRow,
      isBackside: false,
      azimuthDiffDeg: deltaDeg
  };
};

/**
 * 推奨行間隔を計算
 */
export const calculateRowSpacing = (shadowLengthM, mode, value) => {
  if (shadowLengthM === Infinity) return 0; // 特殊ケース
  if (shadowLengthM < 0) return 0;
  
  if (mode === 'factor') {
    return shadowLengthM * value;
  } else if (mode === 'fixed') {
    return shadowLengthM + value;
  }
  return shadowLengthM;
};
