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
import axios from 'axios';

import FileGear from "@spectrum-icons/workflow/FileGear";
import actions from "../config.json";
import { priConExtensionId,SERIES,MARKET_SEGMENT } from "./Constants";

const PRECON_MODEL_API_URL = `https://productdata.api.bmw/pdh/precons/v1.0/${SERIES}/${MARKET_SEGMENT}`;

export default function () {
  const [guestConnection, setGuestConnection] = useState();
  const [loading, setLoading] = useState(true);
  const [headers, setHeaders] = useState();
  const [path, setPath] = useState("");
  const [savingInProgress, setSavingInProgress] = useState(false);

  const [carSerieses, setCarSerieses] = useState([]);
  const [selectedCarSeries, setSelectedCarSeries] = useState();

  const [seriesCode,setSeriesCode]= useState();
  const [rangeCode,setRangeCode]= useState();

  const [carModelRange, setCarModelRange] = useState([]);
  const [selectedCarModelRange, setSelectedCarModelRange] = useState();

  const [preConData, setPreconData] = useState([]);
  const [selectedPrecon, setSelectedPrecon] = useState();


  const onCarSeriesChangeHandler = (value) => {
    console.log("onChange on extension side", value);
    setSelectedCarSeries(value);
    setSeriesCode(value);
    guestConnection?.host?.field.onChange(value);
  };
  
  const onCarModelRangeChangeHandler = (value) => {
    console.log("onChange on extension side", value);
    setSelectedCarModelRange(value);
    setRangeCode(value);
    guestConnection?.host?.field.onChange(value)
  };

  const onPreconChangeHandler = (value) => {
    console.log("onChange on extension side", value);
    setSelectedPrecon(value);
    guestConnection?.host?.field.onChange(value)
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(PRECON_MODEL_API_URL);
        const data = await response.json();
        const seriesCodes = Object.values(data).map(item => item.seriesCode);
        setCarSerieses(Object.values(seriesCodes));
        seriesCodes?.map((item) => setSeriesCode(item?.seriesCode));
        const connection = await attach({ id: priConExtensionId });
        setGuestConnection(connection);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  //modelrange
    //modelrange
  const URL = `https://productdata.api.bmw/pdh/precons/v1.0/ranges/${MARKET_SEGMENT}`;
  useEffect(() => {
    const fetchModelRange = async () => {
      if (!seriesCode) return;
      try {
        const modelDetailUrl = `${URL}/${seriesCode}`;
        const modelDetailResponse = await axios.get(modelDetailUrl);
        const modelDetail = modelDetailResponse?.data;
        const rangeCode = Object.values(modelDetail).map(item => item.modelRangeCode);
        setCarModelRange(Object.values(rangeCode));
        rangeCode?.map((item) => setRangeCode(item?.modelRangeCode));
        const connection = await attach({ id: priConExtensionId });
        setGuestConnection(connection);
      } catch (error) {
        console.error('Error fetching details for model', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModelRange();
  }, [seriesCode]);

  const PRECON_VEHICLE_API_URL = `https://productdata.api.bmw/pdh/precons/v1.0/vehicles/${MARKET_SEGMENT}`
  useEffect(() =>{
    const fetchVehicle = async () => {
      if (!rangeCode) return;
      try {
        const modelDetailUrl = `${PRECON_VEHICLE_API_URL}/${rangeCode}?vehicle_type=PRECON`;
        const response = await axios.get(modelDetailUrl);
        const preConId = Object.values(response.data).map(item => item.id);
        setPreconData(Object.values(preConId));

        const connection = await attach({ id: priConExtensionId });
        setGuestConnection(connection);
      } catch (error) {
        console.error('Error fetching details for model', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
}, [rangeCode]);

  return (
    <Provider theme={lightTheme} colorScheme="light">
      <Flex direction="column">
        <Form isHidden={loading}>
          <Picker
            label="Car Series"
            necessityIndicator="label"
            onSelectionChange={onCarSeriesChangeHandler}
            placeholder="Select a series"
            selectedKey={selectedCarSeries}
            isRequired
          >
            {carSerieses.map((item) => (
              <Item key={item} value={item}>{item}</Item>
            ))}
          </Picker>
          <Picker
            label="Car Model"
            necessityIndicator="label"
            onSelectionChange={onCarModelRangeChangeHandler}
            placeholder="Select a model"
            isRequired
            selectedKey={selectedCarModelRange}
          >
            {carModelRange?.map((rangeCode) => (
              <Item key={rangeCode}>{rangeCode}</Item>
            ))}
          </Picker>
          <Picker
            label="Precon ID"
            necessityIndicator="label"
            onSelectionChange={onPreconChangeHandler}
            placeholder="Select a Precon Id"
            isRequired
            selectedKey={selectedPrecon}
          >
            {preConData?.map((item) => (
              <Item key={item} value={item}>{item}</Item>
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