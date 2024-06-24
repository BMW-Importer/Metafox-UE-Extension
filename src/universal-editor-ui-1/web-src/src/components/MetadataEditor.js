/*
 * <license header>
 */

import {
  Button,
  Divider,
  Flex,
  Form,
  Heading,
  Item,
  Picker,
  ProgressCircle,
  Provider,
  TextField,
  View,
  lightTheme,
} from "@adobe/react-spectrum";
import { attach } from "@adobe/uix-guest";
import React, { useEffect, useState } from "react";

import FileGear from "@spectrum-icons/workflow/FileGear";
import actions from "../config.json";
import { extensionId } from "./Constants";
import { BASE_URL, MARKET_SEGMENT, LATEST } from "./Constants";

const CAR_MODEL_API_URL = "https://productdata-int1.api.bmw//pdh/categoryhub/v1.0/all/bmw+marketB4R1+bmw_rs+sr_RS/latest";
export default function () {
  const [guestConnection, setGuestConnection] = useState();
  const [loading, setLoading] = useState(true);
  const [headers, setHeaders] = useState();
  const [path, setPath] = useState("");
  const [savingInProgress, setSavingInProgress] = useState(false);

  const [carModelRange, setcarModelRange] = useState();
  const [applicableCarModelRange, setApplicableCarModelRange] = useState([]);
  const [selectedCarModelRange, setselectedCarModelRange] = useState();

  const [carSerieses, setCarSerieses] = useState([]);
  const [selectedCarSeries, setSelectedCarSeries] = useState();

  const [carModels, setcarModels] = useState();
  const [selectedCarModels, setselectedCarModels] = useState();
  const [applicableCarModels, setApplicableCarModels] = useState([]);


  const onCarModelRangeChangeHandler = (value) => {
    console.log("onChange on extension side", value);
    setselectedCarModelRange(value);
    guestConnection?.host.field.onChange(value);
  };


  const onCarModelsChangeHandler = (value) => {
    console.log("onChange on extension side", value);
    setselectedCarModels(value);
    guestConnection?.host.field.onChange(value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(CAR_MODEL_API_URL);
        const data = await response.json();
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
        console.log(carModelRangeGroupedByCarSeries);

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

        console.log(carModelGroupedByModelRange);
        setcarModelRange(carModelRangeGroupedByCarSeries);
        setCarSerieses(Object.keys(carModelRangeGroupedByCarSeries));

        //model
        setcarModels(carModelGroupedByModelRange);
        console.log(Object.keys(carModelRangeGroupedByCarSeries));
        setCarSerieses(Object.keys(carModelGroupedByModelRange));

        const connection = await attach({ id: extensionId });
        setGuestConnection(connection);

        const currrentCarModelrange = await connection.host.field.getValue();
        console.log(">> currrentCarModelrange", currrentCarModelrange);


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


          console.log(
            "selectedCarModelRange",
            currrentCarModelrange,
            "selectedCarSeries",
            currentCarSeries,
          );

          // get field value
          setSelectedCarSeries(currentCarSeries);
          setselectedCarModelRange(currrentCarModelrange);
          setApplicableCarModelRange(carModelRangeGroupedByCarSeries[currentCarSeries]);

        }

        //model

        const currrentCarModel = await connection.host.field.getValue();
        console.log(">> currrentCarModel", currrentCarModel);


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

          console.log("model");

          console.log("Marketingseries",
            currentCarSeries);

          //model
          setSelectedCarSeries(currentCarSeries);
          setselectedCarModels(currrentCarModel);
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
    if (selectedCarSeries) {
      setApplicableCarModelRange(carModelRange[selectedCarSeries]);
    }
  }, [selectedCarSeries]);

  useEffect(() => {
    if (selectedCarSeries) {
      //model
      setApplicableCarModels(carModels[selectedCarSeries]);
    }
  }, [selectedCarSeries]);

  return (
    <Provider theme={lightTheme} colorScheme="light">
      <Flex direction="column">
        <Form isHidden={loading}>
          series: {JSON.stringify(selectedCarSeries)}
          model: {JSON.stringify(selectedCarModelRange)}
          applicableMOdels: {JSON.stringify(applicableCarModelRange)}
          <Picker
            label="Car Series"
            necessityIndicator="label"
            onSelectionChange={setSelectedCarSeries}
            placeholder="Select a series"
            selectedKey={selectedCarSeries}
            isRequired
          >
            {carSerieses.map((item) => (
              <Item key={item}>{item}</Item>
            ))}
          </Picker>
          <Picker
            label="Car Model range"
            necessityIndicator="label"
            onSelectionChange={onCarModelRangeChangeHandler}
            placeholder="Select a model range"
            isRequired
            selectedKey={selectedCarModelRange}
            // defaultSelectedKey={selectedCarModelRange}
            isDisabled={!selectedCarSeries}
          >
            {[...new Set(applicableCarModelRange)].map((modelrangeCode) => (
              <Item key={modelrangeCode} value={modelrangeCode}>
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
            //defaultSelectedKey={selectedCarModelRange}
            isDisabled={!selectedCarModelRange}
          >
            {applicableCarModels?.map((modelCode) => (
              <Item key={modelCode}>{modelCode}</Item>
            ))}
          </Picker>

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
      </Flex>{" "}
    </Provider>
  );
}