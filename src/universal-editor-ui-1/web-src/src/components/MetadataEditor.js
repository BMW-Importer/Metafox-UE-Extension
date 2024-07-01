/*
 * <license header>
 */

import {
  Flex,
  Form,
  Item,
  Picker,
  ProgressCircle,
  Provider,
  View,
  lightTheme,
  Checkbox
} from "@adobe/react-spectrum";
import { attach } from "@adobe/uix-guest";
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { extensionId, BASE_URL, MARKET_SEGMENT, LATEST } from "./Constants";

const CAR_MODEL_API_URL = `${BASE_URL}${MARKET_SEGMENT}${LATEST}`;

export default function () {
  const [guestConnection, setGuestConnection] = useState();
  const [loading, setLoading] = useState(true);
  const [carModelRange, setCarModelRange] = useState();
  const [applicableCarModelRange, setApplicableCarModelRange] = useState([]);
  const [selectedCarModelRange, setSelectedCarModelRange] = useState();

  const [carSerieses, setCarSerieses] = useState([]);
  const [selectedCarSeries, setSelectedCarSeries] = useState();

  const [carModels, setCarModels] = useState();
  const [selectedCarModels, setSelectedCarModels] = useState();
  const [applicableCarModels, setApplicableCarModels] = useState([]);

  const [modelCode, setModelCode] = useState();
  const [vehicleData, setVehicleData] = useState([]);
  const [selectedTransmissionCode, setSelectedTransmissionCode] = useState();
  const [carModelByTransmission, setCarModelByTransmission] = useState({});

  let [selected, setSelected] = useState(false);


  const onCarModelRangeChangeHandler = (value) => {
    setSelectedCarModelRange(value);
    guestConnection?.host?.field.onChange(value)
  };

  const onCarModelsChangeHandler = (value) => {
    setSelectedCarModels(value);
    setModelCode(value);
    guestConnection?.host?.field.onChange(`${selectedCarSeries}, ${selectedCarModelRange}, ${value}, ${selected},`);

  };
  const onCarTransmissionChangeHandler = (value) => {
    setSelectedTransmissionCode(value);
    guestConnection?.host?.field.onChange(`${selectedCarSeries}, ${selectedCarModelRange}, ${selectedCarModels}, ${selected}, ${value}`);
  };
  const URL = 'https://productdata.api.bmw/pdh/technicaldata/v2.0/model/bmw+marketB4R1+bmw_rs+sr_RS/latest';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(CAR_MODEL_API_URL);
        const data = await response.json();
        data?.models?.map((model) => setModelCode(model?.modelCode));
        const carModelRangeGroupedByCarSeries = data?.models?.reduce(
          (result, item) => {
            const seriesCode = item.seriesCode;
            if (!result[seriesCode]) {
              result[seriesCode] = [];
            }
            result[seriesCode].push(item.modelRangeCode);   //rangecode
            return result;
          },
          {}
        );

        const carModelGroupedByModelRange = data?.models?.reduce(
          (result, item) => {
            const seriesCode = item.seriesCode;
            if (!result[seriesCode]) {
              result[seriesCode] = [];
            }
            result[seriesCode].push(item.modelCode);   //modelcode
            return result;
          },
          {}
        );
        setCarModelRange(carModelRangeGroupedByCarSeries);
        setCarSerieses(Object.keys(carModelRangeGroupedByCarSeries));

        //model
        setCarModels(carModelGroupedByModelRange);
        setCarSerieses(Object.keys(carModelGroupedByModelRange));

        const connection = await attach({ id: extensionId });
        setGuestConnection(connection);

        const currrentCarModelrange = await connection.host.field.getValue();

        if (carModelRangeGroupedByCarSeries && currrentCarModelrange) {
          let currentCarSeries = null;
          for (let seriesCode in carModelRangeGroupedByCarSeries) {
            if (
              carModelRangeGroupedByCarSeries[seriesCode].includes(currrentCarModelrange)
            ) {
              currentCarSeries = seriesCode;
              break;
            }
          }

          // get field value
          setSelectedCarSeries(currentCarSeries);
          setSelectedCarModelRange(currrentCarModelrange);
          setApplicableCarModelRange(carModelRangeGroupedByCarSeries[currentCarSeries]);

        }
        //model
        const currrentCarModel = await connection.host.field.getValue();

        if (carModelGroupedByModelRange && currrentCarModel) {
          let currentCarSeries = null;
          for (let seriesCode in carModelGroupedByModelRange) {
            if (
              carModelGroupedByModelRange[seriesCode].includes(currrentCarModel)
            ) {
              currentCarSeries = seriesCode;
              break;
            }
          }

          //model
          setSelectedCarSeries(currentCarSeries);
          setSelectedCarModels(currrentCarModel);
          setApplicableCarModels(carModelGroupedByModelRange[currentCarSeries]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchVehiclesData = async () => {
      if (!modelCode) return;
      try {
        const modelDetailUrl = `${URL}/${modelCode}`;
        const modelDetailResponse = await axios.get(modelDetailUrl);
        const modelDetail = modelDetailResponse?.data;
        setVehicleData(modelDetail?.vehicles);
      } catch (error) {
        console.error('Error fetching details for model', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehiclesData();
  }, [modelCode]);


  useEffect(() => {
    if (vehicleData.length > 0) {
      const groupedByTransmission = vehicleData.reduce((result, vehicle) => {
        const { transmissionCode } = vehicle;
        if (!result[modelCode]) {
          result[modelCode] = [];
        }
        if (!result[modelCode].includes(transmissionCode)) {
          result[modelCode].push(transmissionCode);
        }
        return result;
      }, {});
      setCarModelByTransmission(groupedByTransmission);
    }
  }, [vehicleData, modelCode]);

  useEffect(() => {
    if (selectedCarSeries) {
      setApplicableCarModelRange(carModelRange[selectedCarSeries]);
      setApplicableCarModels(carModels[selectedCarSeries]);
    }
  }, [selectedCarSeries]);

  return (
    <Provider theme={lightTheme} colorScheme="light">
      <Flex direction="column">
        <Form isHidden={loading}>
          <Picker
            label="Car Series"
            necessityIndicator="label"
            onSelectionChange={setSelectedCarSeries}
            placeholder="Select a series"
            selectedKey={selectedCarSeries}
            isRequired
          >
            {[...new Set(carSerieses)]?.map((item) => (
              <Item key={item} value={item}>{item}</Item>
            ))}
          </Picker>
          <Picker
            label="Car Model range"
            necessityIndicator="label"
            onSelectionChange={onCarModelRangeChangeHandler}
            placeholder="Select a model range"
            isRequired
            selectedKey={selectedCarModelRange}
            isDisabled={!selectedCarSeries}
          >
            {[...new Set(applicableCarModelRange)].map((modelrangeCode) => (
              <Item key={modelrangeCode}>
                {modelrangeCode}
              </Item>
            ))}
          </Picker>

          <Picker
            label="Car Model"
            necessityIndicator="label"
            onSelectionChange={onCarModelsChangeHandler}
            placeholder="Select a model"
            isRequired
            selectedKey={selectedCarModels}
            isDisabled={!selectedCarModelRange}
          >
            {[...new Set(applicableCarModels)]?.map((modelCode) => (
              <Item key={modelCode}>{modelCode}</Item>
            ))}
          </Picker>
          <Checkbox isSelected={selected} onChange={setSelected}>
            Enable Technical Data
          </Checkbox>
          {selected && <Picker
            label="Transmission"
            necessityIndicator="label"
            onSelectionChange={onCarTransmissionChangeHandler}
            placeholder="Select a transmission"
            isRequired
            selectedKey={selectedTransmissionCode}
            isDisabled={!selectedCarModels}
          >
            {carModelByTransmission[modelCode]?.map((transmission) => (
              <Item key={transmission} value={transmission}>{transmission}</Item>
            ))}
          </Picker>}

        </Form>
        <View isHidden={!loading}>
          <Flex
            direction="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            gap={"size-200"}
          >
            <ProgressCircle size="L" aria-label="Loading..." isIndeterminate />
            <i>Loading...</i>
          </Flex>
        </View>
      </Flex>
    </Provider>
  );
}
