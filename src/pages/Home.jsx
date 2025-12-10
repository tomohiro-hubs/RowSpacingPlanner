import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Sun, Ruler, RefreshCw, AlertCircle } from "lucide-react";
import Diagram from '../components/Diagram';
import { calculateTopGLHeight, calculateRowSpacing, calculateSolarPosition, calculateRowShadow } from '../lib/calculations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label as RechartsLabel } from 'recharts';

const Home = () => {
  // --- Data State ---
  const [solarData, setSolarData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Input States ---
  const [regionId, setRegionId] = useState('');
  const [time, setTime] = useState('12:00');
  const [panelAzimuth, setPanelAzimuth] = useState('180'); // 180 = South
  
  // GL Height Mode
  const [glMode, setGlMode] = useState('direct'); // 'direct' or 'panel'
  const [manualGlHeight, setManualGlHeight] = useState(1.5);
  
  // Panel Dimensions for Calculation
  const [panelLengthMm, setPanelLengthMm] = useState(2278);
  const [panelWidthMm, setPanelWidthMm] = useState(1134);
  const [verticalCount, setVerticalCount] = useState(2);
  const [tiltDeg, setTiltDeg] = useState(20);
  const [bottomClearanceMm, setBottomClearanceMm] = useState(600);

  // Margin Settings
  const [marginMode, setMarginMode] = useState('factor'); // 'factor' or 'fixed'
  const [marginFactor, setMarginFactor] = useState(1.0);
  const [marginFixedM, setMarginFixedM] = useState(0.5);

  // Verification
  const [existingSpacing, setExistingSpacing] = useState('');

  // --- Calculated Results State ---
  const [result, setResult] = useState(null);
  const [calculatedGlHeight, setCalculatedGlHeight] = useState(0);
  
  // Chart Data State
  const [chartData, setChartData] = useState([]);
  const [maxSpacing, setMaxSpacing] = useState({ time: '', value: 0 });

  // --- Load Data & Hydrate ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('./data.json');
        if (!res.ok) throw new Error(`Data load failed: ${res.status}`);
        const json = await res.json();
        
        // Hydrate data
        const hydratedRegions = json.regions.map(region => {
            const times = [];
            for (let h = 9; h <= 15; h++) {
                const pos = calculateSolarPosition(region.lat, region.lon, h);
                times.push({
                    time: `${h < 10 ? '0' : ''}${h}:00`,
                    altitudeDeg: Number(pos.altitudeDeg.toFixed(1)),
                    azimuthDeg: Number(pos.azimuthDeg.toFixed(1))
                });
            }
            return {
                ...region,
                solarDesignSets: [{
                    key: 'winter_solstice',
                    label: '冬至（12/21 相当）',
                    description: '冬至の日本標準時における太陽高度・方位 (計算値)',
                    times: times
                }]
            };
        });

        const fullData = { ...json, regions: hydratedRegions };
        setSolarData(fullData);
        
        // Load settings
        const saved = localStorage.getItem('pv-row-spacing-settings');
        if (saved) {
          try {
            const s = JSON.parse(saved);
            if (s.regionId && hydratedRegions.find(r => r.id === s.regionId)) {
                setRegionId(s.regionId);
            } else if (hydratedRegions.length > 0) {
                setRegionId('tokyo'); 
            }
            if (s.time) setTime(s.time);
            if (s.panelAzimuth) setPanelAzimuth(s.panelAzimuth);
            if (s.glMode) setGlMode(s.glMode);
            if (s.manualGlHeight) setManualGlHeight(s.manualGlHeight);
            if (s.panelLengthMm) setPanelLengthMm(s.panelLengthMm);
            if (s.verticalCount) setVerticalCount(s.verticalCount);
            if (s.tiltDeg) setTiltDeg(s.tiltDeg);
            if (s.bottomClearanceMm) setBottomClearanceMm(s.bottomClearanceMm);
            if (s.marginMode) setMarginMode(s.marginMode);
            if (s.marginFactor) setMarginFactor(s.marginFactor);
            if (s.marginFixedM) setMarginFixedM(s.marginFixedM);
          } catch (e) {
            console.error("Failed to parse saved settings", e);
          }
        } else {
             setRegionId('tokyo');
        }

      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Dynamic Calculations ---
  useEffect(() => {
    if (glMode === 'panel') {
      const h = calculateTopGLHeight({
        panelLengthMm: Number(panelLengthMm),
        verticalCount: Number(verticalCount),
        tiltDeg: Number(tiltDeg),
        bottomClearanceMm: Number(bottomClearanceMm)
      });
      setCalculatedGlHeight(h);
    }
  }, [panelLengthMm, verticalCount, tiltDeg, bottomClearanceMm, glMode]);

  // --- Actions ---
  const handleCalculate = () => {
    if (!solarData || !regionId) return;

    const region = solarData.regions.find(r => r.id === regionId);
    if (!region) return;

    const designSet = region.solarDesignSets.find(s => s.key === 'winter_solstice');
    if (!designSet) return;

    const timeData = designSet.times.find(t => t.time === time);
    if (!timeData) {
      alert("選択された時刻のデータがありません");
      return;
    }

    const hTop = glMode === 'direct' ? Number(manualGlHeight) : calculatedGlHeight;

    // --- Single Point Calculation ---
    const shadowResult = calculateRowShadow(
        hTop, 
        timeData.altitudeDeg, 
        timeData.azimuthDeg, 
        Number(panelAzimuth)
    );

    const marginVal = marginMode === 'factor' ? Number(marginFactor) : Number(marginFixedM);
    const spacing = calculateRowSpacing(shadowResult.lRow, marginMode, marginVal);

    setResult({
      regionName: region.nameJa,
      time: time,
      altitudeDeg: timeData.altitudeDeg,
      azimuthDeg: timeData.azimuthDeg,
      panelAzimuthDeg: Number(panelAzimuth),
      hTop: hTop,
      lBasic: shadowResult.lBasic,
      lRow: shadowResult.lRow,
      isBackside: shadowResult.isBackside,
      recommendedSpacing: spacing,
      azimuthDiff: shadowResult.azimuthDiffDeg,
      marginDetail: marginMode === 'factor' ? `× ${marginFactor}` : `+ ${marginFixedM}m`
    });

    // --- Chart Data Calculation (9:00 - 15:00) ---
    const chartDataPoints = designSet.times.map(t => {
        const sr = calculateRowShadow(
            hTop,
            t.altitudeDeg,
            t.azimuthDeg,
            Number(panelAzimuth)
        );
        const sp = calculateRowSpacing(sr.lRow, marginMode, marginVal);
        return {
            time: t.time,
            spacing: Number(sp.toFixed(2)),
            lRow: Number(sr.lRow.toFixed(2)),
            isBackside: sr.isBackside
        };
    });

    setChartData(chartDataPoints);
    
    // Find Max Spacing
    const maxVal = chartDataPoints.reduce((max, curr) => curr.spacing > max.value ? { time: curr.time, value: curr.spacing } : max, { time: '', value: 0 });
    setMaxSpacing(maxVal);

    // Save to LocalStorage
    const settings = {
      regionId, time, panelAzimuth, glMode, manualGlHeight,
      panelLengthMm, verticalCount, tiltDeg, bottomClearanceMm,
      marginMode, marginFactor, marginFixedM
    };
    localStorage.setItem('pv-row-spacing-settings', JSON.stringify(settings));
  };

  const getTimeOptions = () => {
    if (!solarData || !regionId) return [];
    const region = solarData.regions.find(r => r.id === regionId);
    if (!region) return [];
    const set = region.solarDesignSets.find(s => s.key === 'winter_solstice');
    return set ? set.times : [];
  };

  const setAzimuthPreset = (val) => setPanelAzimuth(String(val));

  if (isLoading) return <div className="p-8 text-center">データを読み込み中...</div>;
  if (error) return <div className="p-8 text-center text-red-500">エラーが発生しました: {error.message} <br/> <Button onClick={() => window.location.reload()} className="mt-4">リロード</Button></div>;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Input Column */}
        <div className="w-full md:w-7/12 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sun className="w-5 h-5"/> 設計条件</CardTitle>
              <CardDescription>地域とパネル条件を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Region & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>地域 (47都道府県)</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={regionId}
                    onChange={(e) => setRegionId(e.target.value)}
                  >
                    {solarData.regions.map(r => (
                      <option key={r.id} value={r.id}>{r.nameJa}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>時刻 (冬至)</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  >
                    {getTimeOptions().map(t => (
                      <option key={t.time} value={t.time}>{t.time}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Panel Azimuth */}
              <div className="space-y-3">
                <Label>パネル方位角 Am [deg]</Label>
                <div className="flex gap-2 items-center">
                    <Input 
                      type="number" 
                      value={panelAzimuth} 
                      onChange={(e) => setPanelAzimuth(e.target.value)} 
                      placeholder="例: 180" 
                      className="w-32"
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setAzimuthPreset(180)}>南(180)</Button>
                        <Button variant="outline" size="sm" onClick={() => setAzimuthPreset(135)}>南東(135)</Button>
                        <Button variant="outline" size="sm" onClick={() => setAzimuthPreset(225)}>南西(225)</Button>
                        <Button variant="outline" size="sm" onClick={() => setAzimuthPreset(90)}>東(90)</Button>
                        <Button variant="outline" size="sm" onClick={() => setAzimuthPreset(270)}>西(270)</Button>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground bg-slate-100 p-2 rounded">
                    <span className="font-semibold">方位ガイド:</span> 北=0°, 東=90°, 南=180°, 西=270°
                </div>
              </div>

              {/* GL Height Input Mode */}
              <div className="space-y-2">
                <Label>パネル上端 GL高さ</Label>
                <Tabs defaultValue="direct" value={glMode} onValueChange={setGlMode} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="direct">直接入力</TabsTrigger>
                    <TabsTrigger value="panel">寸法から計算</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="direct" className="space-y-4 pt-4">
                     <div className="space-y-2">
                        <Label>上端 GL高さ [m]</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={manualGlHeight} 
                          onChange={(e) => setManualGlHeight(e.target.value)} 
                        />
                     </div>
                  </TabsContent>
                  
                  <TabsContent value="panel" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>パネル長辺 [mm]</Label>
                        <Input type="number" value={panelLengthMm} onChange={(e) => setPanelLengthMm(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>縦段数</Label>
                        <Input type="number" value={verticalCount} onChange={(e) => setVerticalCount(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>傾斜角 [deg]</Label>
                        <Input type="number" value={tiltDeg} onChange={(e) => setTiltDeg(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>下端 GL [mm]</Label>
                        <Input type="number" value={bottomClearanceMm} onChange={(e) => setBottomClearanceMm(e.target.value)} />
                      </div>
                    </div>
                    <div className="bg-muted p-3 rounded-md text-sm flex justify-between items-center font-medium">
                      <span>計算上の上端GL:</span>
                      <span className="text-primary text-lg">{calculatedGlHeight.toFixed(3)} m</span>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Margin Settings */}
              <div className="space-y-3 pt-2 border-t">
                <Label>安全マージン</Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input type="radio" checked={marginMode === 'factor'} onChange={() => setMarginMode('factor')} />
                    <span>割増係数</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input type="radio" checked={marginMode === 'fixed'} onChange={() => setMarginMode('fixed')} />
                    <span>固定距離加算</span>
                  </label>
                </div>
                {marginMode === 'factor' ? (
                  <div className="flex items-center gap-2">
                     <Label className="w-20">係数</Label>
                     <Input type="number" step="0.1" value={marginFactor} onChange={(e) => setMarginFactor(e.target.value)} className="w-32" />
                     <span className="text-sm text-muted-foreground">倍</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                     <Label className="w-20">追加距離</Label>
                     <Input type="number" step="0.1" value={marginFixedM} onChange={(e) => setMarginFixedM(e.target.value)} className="w-32" />
                     <span className="text-sm text-muted-foreground">m</span>
                  </div>
                )}
              </div>

            </CardContent>
            <CardFooter>
              <Button className="w-full text-lg" onClick={handleCalculate} size="lg">
                <Ruler className="mr-2 h-5 w-5"/> 行間隔を計算
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Result Column */}
        <div className="w-full md:w-5/12 space-y-6">
          {result ? (
            <Card className={`border ${result.isBackside ? 'border-amber-400 bg-amber-50' : 'border-primary/20 bg-slate-50/50'}`}>
              <CardHeader className={`${result.isBackside ? 'bg-amber-100/50' : 'bg-primary/5'} pb-4`}>
                <CardTitle className="text-primary flex items-center justify-between">
                    計算結果
                    {result.isBackside && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">背面日射</span>}
                </CardTitle>
                <CardDescription>{result.regionName} / 冬至 {result.time}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                {result.isBackside ? (
                    <div className="text-center p-4 bg-white rounded-lg border border-amber-200 text-amber-800">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-600"/>
                        <p className="font-bold">影による制約なし</p>
                        <p className="text-sm mt-1">
                            太陽がパネルの背面（または真横）にあるため、<br/>
                            前列パネルは後列に影を落としません。
                        </p>
                    </div>
                ) : (
                    <div className="text-center space-y-1">
                       <p className="text-sm text-muted-foreground">推奨行間隔 (最小ピッチ)</p>
                       <p className="text-4xl font-bold text-primary">{result.recommendedSpacing.toFixed(2)} <span className="text-xl font-normal text-muted-foreground">m</span></p>
                       <p className="text-xs text-muted-foreground">(= 行方向影長 {result.lRow.toFixed(2)} m {result.marginDetail})</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm bg-white p-4 rounded-lg border">
                  <div>
                    <span className="text-muted-foreground block text-xs">太陽高度</span>
                    <span className="font-medium">{result.altitudeDeg}°</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">GL高さ</span>
                    <span className="font-medium">{result.hTop.toFixed(3)} m</span>
                  </div>
                  <div className="col-span-2 border-t my-1"></div>
                  
                  <div>
                    <span className="text-muted-foreground block text-xs">太陽方位 As</span>
                    <span className="font-medium">{result.azimuthDeg}°</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">パネル方位 Am</span>
                    <span className="font-medium">{result.panelAzimuthDeg}°</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">方位差 ΔA (As-Am)</span>
                    <span className="font-medium">{result.azimuthDiff.toFixed(1)}°</span>
                  </div>
                   <div>
                    <span className="text-muted-foreground block text-xs">基本影長 L_basic</span>
                    <span className="font-medium">{result.lBasic === Infinity ? '∞' : result.lBasic.toFixed(2)} m</span>
                  </div>
                  <div className="col-span-2 bg-blue-50 p-2 rounded mt-1">
                    <span className="text-primary block text-xs font-bold">行方向影長 L_row</span>
                    <span className="font-medium text-lg text-primary">{result.lRow.toFixed(2)} m</span>
                    <span className="text-xs text-muted-foreground block">= L_basic × cos(ΔA)</span>
                  </div>
                </div>

                {/* Graph Section */}
                {chartData.length > 0 && (
                    <div className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-semibold flex items-center gap-1"><Info className="w-4 h-4"/> 時間変化 (9:00-15:00)</h4>
                            <div className="text-xs bg-slate-100 px-2 py-1 rounded">
                                最大ピッチ: <span className="font-bold text-red-600">{maxSpacing.value.toFixed(2)}m</span> ({maxSpacing.time})
                            </div>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="time" fontSize={11} tickMargin={8} />
                                    <YAxis fontSize={11} unit="m" width={35} />
                                    <Tooltip 
                                        formatter={(value, name) => [value + ' m', name === 'spacing' ? '推奨間隔' : name]}
                                        labelStyle={{ color: '#333', fontWeight: 'bold' }}
                                        contentStyle={{ fontSize: '12px', borderRadius: '4px' }}
                                    />
                                    <ReferenceLine x={result.time} stroke="#aaa" strokeDasharray="3 3" />
                                    <Line 
                                        type="monotone" 
                                        dataKey="spacing" 
                                        stroke="hsl(222.2 47.4% 11.2%)" 
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                        name="推奨間隔"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">※赤字は9:00-15:00の範囲内での最大必要間隔</p>
                    </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">配置イメージ (断面)</Label>
                  <Diagram 
                    shadowLength={result.lRow}
                    rowSpacing={result.recommendedSpacing}
                    panelHeightGL={result.hTop}
                    sunAltitude={result.altitudeDeg}
                    isBackside={result.isBackside}
                  />
                </div>

                {/* Validation Tool */}
                <div className="pt-4 border-t space-y-3">
                   <Label className="flex items-center gap-2 text-muted-foreground"><RefreshCw className="w-4 h-4"/> 既存案の検証</Label>
                   <div className="flex gap-2">
                     <Input 
                       placeholder="設計中の行間隔 [m]" 
                       type="number" 
                       value={existingSpacing}
                       onChange={(e) => setExistingSpacing(e.target.value)}
                     />
                   </div>
                   {existingSpacing && (
                     <div className={`text-sm font-medium p-2 rounded text-center ${!result.isBackside && Number(existingSpacing) >= result.recommendedSpacing ? 'bg-green-100 text-green-700' : (result.isBackside ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}`}>
                        {result.isBackside 
                            ? '影の制約はありません' 
                            : (Number(existingSpacing) >= result.recommendedSpacing 
                                ? 'OK: 影はかかりません' 
                                : `NG: ${(result.recommendedSpacing - Number(existingSpacing)).toFixed(2)}m 不足しています`
                              )
                        }
                     </div>
                   )}
                </div>

              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-8 border-2 border-dashed rounded-lg text-muted-foreground bg-slate-50">
               <div className="text-center">
                 <Ruler className="w-12 h-12 mx-auto mb-2 opacity-20"/>
                 <p>条件を入力して<br/>「計算」ボタンを押してください</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
