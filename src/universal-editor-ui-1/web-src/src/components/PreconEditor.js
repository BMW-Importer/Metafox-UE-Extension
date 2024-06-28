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
  import { priConExtensionId, SERIES, MARKET_SEGMENT } from "./Constants";
  
  const PRECON_MODEL_API_URL = `https://productdata.api.bmw/pdh/precons/v1.0/${SERIES}/${MARKET_SEGMENT}`;
  
  export default function () {
    
    const [guestConnection, setGuestConnection] = useState();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await fetch(PRECON_MODEL_API_URL);
          const data = await response.json();
          console.log(data);

          const connection = await attach({ id: priConExtensionId });
            setGuestConnection(connection);
        } catch (error) {} finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, []);
  
    return (
      <Provider theme={lightTheme} colorScheme="light">
        <Flex direction="column">
          <View isHidden={!loading}>
            <Flex
              direction="column"
              alignItems="center"
              justifyContent="center"
              height="100%"
              gap={"size-200"}
            >
        <Form isHidden={loading}>
          <Picker
            label="Transmission"
            necessityIndicator="label"
            placeholder="Select a transmission"
            isRequired
          ><Item >{'transmission'}</Item>
          </Picker>

        </Form>
              <ProgressCircle size="L" aria-label="Loading..." isIndeterminate />
              <i>Loading...</i>
            </Flex>
          </View>
        </Flex>
      </Provider>
    );
  }
  