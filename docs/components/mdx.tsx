import defaultMdxComponents from 'fumadocs-ui/mdx';
import type {MDXComponents} from 'mdx/types';
import {AnimePopperDemo} from '@/components/demos/AnimePopperDemo';
import {BasicDemo} from '@/components/demos/BasicDemo';
import {BasicPositioningDemo} from '@/components/demos/BasicPositioningDemo';
import {CellRenderDemo} from '@/components/demos/CellRenderDemo';
import {CustomGridShapeDemo} from '@/components/demos/CustomGridShapeDemo';
import {FooterButtonsDemo} from '@/components/demos/FooterButtonsDemo';
import {FormatFunctionDemo} from '@/components/demos/FormatFunctionDemo';
import {InlineDemo} from '@/components/demos/InlineDemo';
import {ManualPositionDemo} from '@/components/demos/ManualPositionDemo';
import {MobileDemo} from '@/components/demos/MobileDemo';
import {MonthSelectionDemo} from '@/components/demos/MonthSelectionDemo';
import {PopperDemo} from '@/components/demos/PopperDemo';
import {RangeDemo} from '@/components/demos/RangeDemo';
import {SelectedDatesMultiDemo} from '@/components/demos/SelectedDatesMultiDemo';
import {SelectedInitialDateDemo} from '@/components/demos/SelectedInitialDateDemo';
import {TimeDemo} from '@/components/demos/TimeDemo';
import {TitleFormattingDemo} from '@/components/demos/TitleFormattingDemo';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    BasicDemo,
    BasicPositioningDemo,
    InlineDemo,
    ManualPositionDemo,
    MobileDemo,
    MonthSelectionDemo,
    PopperDemo,
    AnimePopperDemo,
    RangeDemo,
    SelectedDatesMultiDemo,
    SelectedInitialDateDemo,
    TimeDemo,
    CellRenderDemo,
    CustomGridShapeDemo,
    TitleFormattingDemo,
    FooterButtonsDemo,
    FormatFunctionDemo,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
