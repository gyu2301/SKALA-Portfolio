# notebooks/legacy — 개별 모델 실험 스크립트 (보존용)

여기 있는 스크립트들은 모델 선정 과정에서 팀원들이 **각자 따로 돌려본 실험 기록**이다.
지금은 [`../model_selection.ipynb`](../model_selection.ipynb) 하나로 통합되었고,
이 디렉토리는 당시 실험 내용을 추적할 수 있게 남겨둔 것이다.

**새 실험은 여기에 추가하지 말고 `model_selection.ipynb`에 모델을 추가한다.**

## 목록

| 파일 | 모델 | 비고 |
|---|---|---|
| `ml_logistic_regression_dropna_test.py` | LogisticRegression (saga, max_iter=5000) | 후보 중 유일하게 스케일링을 적용했었음 |
| `ml_random_forest_dropna_test.py` | RandomForestClassifier (n_estimators=250) | 스케일링 없음 |
| `svc_model.py` | SVC (RBF, C=1.0, gamma="scale") | ROC-AUC 미산출, confusion matrix PNG 저장 |
| `nn_classification.py` | MLPClassifier (64, 32) | 유일하게 시드 20260807 + `fnlwgt` 제외 규약을 따랐음 |
| `xg_boost.py` | XGBClassifier (n_estimators=400, lr=0.05) | 원핫 대신 `enable_categorical=True` 사용 |

## 왜 통합했나

같은 데이터를 쓰는데도 스크립트마다 실험 조건이 달라서, 출력된 숫자들을 한 표에 모아도
**모델 성능 차이인지 전처리 차이인지 구분할 수 없었다.**

| 항목 | LR / RF / XGB | NN | SVC |
|---|---|---|---|
| 시드 | 42 | 20260807 | 미지정 |
| `fnlwgt` | 포함 | 제외 | 제외 |
| 스케일링 | LR만 적용 | 적용 | 적용 |
| ROC-AUC | 산출 | 산출 | **미산출** |

`model_selection.ipynb`는 이 4가지를 통일한 뒤(시드 `20260807`, `fnlwgt` 제외,
공통 `ColumnTransformer`, 공통 지표 세트) 동일 루프로 5개 모델을 학습·평가한다.
하이퍼파라미터는 이 스크립트들에서 그대로 가져왔고 `random_state`만 통일했다.

따라서 **이 스크립트들의 출력 수치와 통합 노트북의 수치는 다르다.**
비교 가능한 쪽은 통합 노트북이다.

## 실행

`notebooks/legacy/` 로 옮기면서 경로가 한 단계 깊어져,
각 스크립트의 `PROJECT_ROOT` 계산을 `parents[2]` 기준으로 함께 수정했다.
저장소 루트에서 그대로 실행된다.

```bash
uv run python notebooks/legacy/xg_boost.py
```
