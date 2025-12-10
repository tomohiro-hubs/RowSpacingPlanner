import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const About = () => {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> 戻る
          </Button>
        </Link>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">PV Row Spacing Planner について</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 leading-relaxed">
          <section>
            <h3 className="text-lg font-semibold mb-2">ツールの目的</h3>
            <p className="text-muted-foreground">
              太陽光発電所の設計において、冬至の最も影が長くなる時期を基準とした「影のかからない最小行間隔（アレイピッチ）」を即座に算出するツールです。
              煩雑な三角関数計算を自動化し、GL設定やマージン設計のシミュレーションを容易にします。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">計算の前提条件</h3>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong>冬至基準:</strong> 年間で最も太陽高度が低い「冬至」のデータを基準に計算します。</li>
              <li><strong>南面設置:</strong> パネルは真南（方位角180°）を向いている前提で、太陽高度のみを使用して影の長さを計算します。方位角による影の斜め方向への伸びは考慮していません（簡易計算）。</li>
              <li><strong>水平地盤:</strong> 地面は水平（勾配0°）であることを前提としています。造成地などの傾斜地では誤差が生じる可能性があります。</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">計算式について</h3>
            <div className="bg-muted p-4 rounded-md font-mono text-sm space-y-2">
              <p>L = パネル縦寸法合計 × sin(傾斜角)</p>
              <p>H_top = L + 下端GL高さ</p>
              <p>Shadow = H_top / tan(太陽高度)</p>
              <p>推奨間隔 = Shadow × 安全係数 (または + 固定距離)</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">データソース</h3>
            <p className="text-muted-foreground">
              本ツールで使用している太陽位置データは、国立天文台等の公開情報を基にした代表都市の計算値をプリセットとして保持しています。
              実務設計においては、建設地の正確な緯度経度に基づく詳細シミュレーションの補助としてご利用ください。
            </p>
          </section>

          <section className="pt-4 border-t text-sm text-muted-foreground">
            <p>Version 1.0.0</p>
            <p>このアプリケーションはクライアントサイド（ブラウザ上）ですべての計算を実行します。入力データがサーバーに送信されることはありません。</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;
